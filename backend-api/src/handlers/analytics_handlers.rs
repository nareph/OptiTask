// OptiTask/backend-api/src/handlers/analytics_handlers.rs

use crate::auth_utils::AuthenticatedUser;
use crate::db::DbPool;
use crate::error_handler::ServiceError;
use crate::models::{AnalyticsQueryPeriod, ProductivityTrendPoint, TimeByProjectStat};
use actix_web::{get, web, HttpResponse, Result as ActixResult};
use chrono::{Datelike, Duration, NaiveDate, TimeZone, Utc, Weekday}; // Pour la gestion des dates
use diesel::prelude::*;
use diesel::sql_query; // Pour exécuter des requêtes SQL brutes si nécessaire
use diesel::sql_types::Uuid as DieselUuid; // Importer les types SQL

// Helper pour déterminer les dates de début et de fin basées sur la période
fn calculate_date_range(
    query_params: &AnalyticsQueryPeriod,
) -> Result<(NaiveDate, NaiveDate), ServiceError> {
    let today = Utc::now().date_naive();

    if let (Some(start), Some(end)) = (query_params.start_date, query_params.end_date) {
        if start > end {
            return Err(ServiceError::BadRequest(
                "start_date cannot be after end_date".to_string(),
            ));
        }
        return Ok((start, end));
    }

    match query_params.period.as_deref() {
        Some("this_week") => {
            // Semaine commence Lundi (iso_week)
            let start_of_week = today
                .week(Weekday::Mon)
                .first_day();
            let end_of_week = today
                .week(Weekday::Mon)
                .last_day();
            Ok((start_of_week, end_of_week))
        }
        Some("last_7_days") => Ok((today - Duration::days(6), today)),
        Some("this_month") => {
            let start_of_month = NaiveDate::from_ymd_opt(today.year(), today.month(), 1).unwrap();
            let end_of_month = NaiveDate::from_ymd_opt(
                today.year() + if today.month() == 12 { 1 } else { 0 }, // Année suivante si Décembre
                if today.month() == 12 { 1 } else { today.month() + 1 }, // Mois suivant
                1,
            )
            .unwrap()
            - Duration::days(1);
            Ok((start_of_month, end_of_month))
        }
        Some("last_30_days") => Ok((today - Duration::days(29), today)),
        None => {
            // Défaut à "cette semaine" si aucune période n'est fournie
            let start_of_week = today.week(Weekday::Mon).first_day();
            let end_of_week = today.week(Weekday::Mon).last_day();
            Ok((start_of_week, end_of_week))
        }
        Some(other) => Err(ServiceError::BadRequest(format!(
            "Invalid period specified: {}. Supported: this_week, last_7_days, this_month, last_30_days or provide start_date & end_date.",
            other
        ))),
    }
}

// === GET /analytics/time-by-project ===
#[get("/time-by-project")]
pub async fn get_time_by_project_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    query_params: web::Query<AnalyticsQueryPeriod>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    log::info!(
        "User {} fetching time_by_project with params: {:?}",
        user_uuid,
        query_params.0 // .0 pour accéder aux données de web::Query
    );

    let (start_date, end_date) = calculate_date_range(&query_params.0)?;
    // Inclure toute la journée de end_date
    let start_datetime = Utc.from_utc_datetime(&start_date.and_hms_opt(0, 0, 0).unwrap()); // Convertir en DateTime<Utc> si besoin pour comparer avec TIMESTAMPTZ
    let end_datetime = Utc.from_utc_datetime(&end_date.and_hms_opt(23, 59, 59).unwrap());

    let stats = web::block(move || -> Result<Vec<TimeByProjectStat>, ServiceError> {
        let mut conn = pool.get()?;

        // Utilisation de sql_query pour plus de flexibilité avec JOIN et GROUP BY
        // Assurez-vous que les noms de colonnes correspondent à votre DB et TimeByProjectStat
        let query = sql_query(
            "SELECT p.id as project_id, p.name as project_name, COALESCE(SUM(te.duration_seconds), 0) as total_duration_seconds \
             FROM time_entries te \
             JOIN tasks t ON te.task_id = t.id \
             JOIN projects p ON t.project_id = p.id \
             WHERE te.user_id = $1 AND t.project_id IS NOT NULL \
             AND te.start_time >= $2 AND te.start_time <= $3 \
             GROUP BY p.id, p.name \
             ORDER BY total_duration_seconds DESC"
        )
        .bind::<DieselUuid, _>(user_uuid)
        .bind::<diesel::sql_types::Timestamptz, _>(start_datetime) // Utiliser Timestamptz si start_time est TIMESTAMPTZ
        .bind::<diesel::sql_types::Timestamptz, _>(end_datetime);  // Idem

        log::debug!("Executing SQL for time_by_project: {:?}", query);

        query.load::<TimeByProjectStat>(&mut conn)
             .map_err(|e| {
                log::error!("Database error in get_time_by_project_handler: {:?}", e);
                ServiceError::from(e)
            })
    })
    .await
    .map_err(|e| { // BlockingError
        log::error!("Blocking task error (get_time_by_project): {:?}", e);
        ServiceError::InternalServerError("Error processing request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(stats))
}

// === GET /analytics/productivity-trend ===
#[get("/productivity-trend")]
pub async fn get_productivity_trend_handler(
    pool: web::Data<DbPool>,
    authenticated_user: AuthenticatedUser,
    query_params: web::Query<AnalyticsQueryPeriod>,
) -> ActixResult<HttpResponse, ServiceError> {
    let user_uuid = authenticated_user.id;
    log::info!(
        "User {} fetching productivity_trend with params: {:?}",
        user_uuid,
        query_params.0
    );

    let (start_date_range, end_date_range) = calculate_date_range(&query_params.0)?;
    // Inclure toute la journée de end_date
    let start_datetime_range =
        Utc.from_utc_datetime(&start_date_range.and_hms_opt(0, 0, 0).unwrap()); // Convertir en DateTime<Utc> si besoin pour comparer avec TIMESTAMPTZ
    let end_datetime_range =
        Utc.from_utc_datetime(&end_date_range.and_hms_opt(23, 59, 59).unwrap());

    let trend_points = web::block(
        move || -> Result<Vec<ProductivityTrendPoint>, ServiceError> {
            let mut conn = pool.get()?;

            // Grouper par jour. Pour TIMESTAMPTZ, on peut utiliser DATE(start_time AT TIME ZONE 'UTC')
            // ou une fonction similaire dépendant de votre DB et timezone.
            // Si start_time est juste TIMESTAMP (sans tz), DATE(start_time) suffit.
            let query_str = "SELECT DATE(te.start_time AT TIME ZONE 'UTC') as date_point, \
                    COALESCE(SUM(te.duration_seconds), 0) as total_duration_seconds \
             FROM time_entries te \
             WHERE te.user_id = $1 \
             AND te.start_time >= $2 AND te.start_time <= $3 \
             GROUP BY date_point \
             ORDER BY date_point ASC";

            let query = sql_query(query_str)
                .bind::<DieselUuid, _>(user_uuid)
                .bind::<diesel::sql_types::Timestamptz, _>(start_datetime_range)
                .bind::<diesel::sql_types::Timestamptz, _>(end_datetime_range);

            log::debug!("Executing SQL for productivity_trend: {:?}", query);

            query
                .load::<ProductivityTrendPoint>(&mut conn)
                .map_err(|e| {
                    log::error!("Database error in get_productivity_trend_handler: {:?}", e);
                    ServiceError::from(e)
                })
        },
    )
    .await
    .map_err(|e| {
        log::error!("Blocking task error (get_productivity_trend): {:?}", e);
        ServiceError::InternalServerError("Error processing request".to_string())
    })??;

    Ok(HttpResponse::Ok().json(trend_points))
}
