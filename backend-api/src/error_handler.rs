// OptiTask/backend-api/src/error_handler.rs
use actix_web::http::StatusCode;
use actix_web::{HttpResponse, ResponseError};
use diesel::result::Error as DieselError;
use r2d2::Error as R2D2Error;
use serde_json::json;
use std::fmt;

#[derive(Debug)]
pub enum ServiceError {
    InternalServerError(String),
    BadRequest(String),
    Unauthorized(String),
    DatabaseError(String),
    NotFound(String),
    PoolError(String),
}

impl ServiceError {
    fn from_diesel_error(error: DieselError) -> ServiceError {
        match error {
            DieselError::DatabaseError(kind, info) => {
                let message = format!("Database error: {:?} - {}", kind, info.message());
                // log::error!("{}", message); // Loggé dans ResponseError si c'est une erreur serveur
                ServiceError::DatabaseError(message)
            }
            DieselError::NotFound => {
                ServiceError::NotFound("The requested record was not found.".to_string())
            }
            err => {
                let message = format!("An unexpected database error occurred: {}", err);
                // log::error!("{}", message); // Loggé dans ResponseError si c'est une erreur serveur
                ServiceError::DatabaseError(message)
            }
        }
    }

    fn from_r2d2_error(error: R2D2Error) -> ServiceError {
        let message = format!("Failed to get database connection from pool: {}", error);
        // log::error!("{}", message); // Loggé dans ResponseError si c'est une erreur serveur
        ServiceError::PoolError("Could not connect to the database.".to_string())
    }
}

impl From<DieselError> for ServiceError {
    fn from(error: DieselError) -> ServiceError {
        ServiceError::from_diesel_error(error)
    }
}

impl From<R2D2Error> for ServiceError {
    fn from(error: R2D2Error) -> ServiceError {
        ServiceError::from_r2d2_error(error)
    }
}

impl fmt::Display for ServiceError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ServiceError::InternalServerError(msg) => write!(f, "Internal Server Error: {}", msg),
            ServiceError::BadRequest(msg) => write!(f, "Bad Request: {}", msg),
            ServiceError::Unauthorized(msg) => write!(f, "Unauthorized: {}", msg),
            ServiceError::DatabaseError(msg) => write!(f, "Database Error: {}", msg),
            ServiceError::NotFound(msg) => write!(f, "Not Found: {}", msg),
            ServiceError::PoolError(msg) => write!(f, "Pool Error: {}", msg),
        }
    }
}

impl ResponseError for ServiceError {
    fn status_code(&self) -> StatusCode {
        match *self {
            ServiceError::InternalServerError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ServiceError::DatabaseError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ServiceError::PoolError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ServiceError::BadRequest(_) => StatusCode::BAD_REQUEST,
            ServiceError::Unauthorized(_) => StatusCode::UNAUTHORIZED,
            ServiceError::NotFound(_) => StatusCode::NOT_FOUND,
        }
    }

    fn error_response(&self) -> HttpResponse {
        let status_code = self.status_code();
        let user_facing_message = match status_code.as_u16() < 500 {
            true => self.to_string(),
            false => "An internal server error occurred. Please try again later.".to_string(),
        };

        if status_code.is_server_error() {
            log::error!("Server Error Response ({}): {}", status_code, self);
        } else {
            log::warn!("Client Error Response ({}): {}", status_code, self);
        }

        HttpResponse::build(status_code).json(json!({
            "status": "error",
            "statusCode": status_code.as_u16(),
            "message": user_facing_message // Message pour l'utilisateur
        }))
    }
}
