// OptiTask/backend-api/src/auth_utils.rs
use actix_web::{dev::Payload, Error as ActixWebError, FromRequest, HttpRequest};
use futures_util::future::{err, ok, Ready}; // Utilisez futures_util pour Ready
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct AuthenticatedUser {
    pub id: Uuid,
}

// Implémentation de FromRequest pour extraire AuthenticatedUser
impl FromRequest for AuthenticatedUser {
    type Error = ActixWebError;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        // Essayer de récupérer le header "X-User-Id"
        if let Some(user_id_header) = req.headers().get("X-User-Id") {
            if let Ok(user_id_str) = user_id_header.to_str() {
                if let Ok(user_id) = Uuid::parse_str(user_id_str) {
                    return ok(AuthenticatedUser { id: user_id });
                }
            }
        }
        // Si le header est manquant ou invalide, retourner une erreur Unauthorized
        // Vous pouvez personnaliser le message d'erreur
        err(actix_web::error::ErrorUnauthorized("Missing or invalid X-User-Id header"))
    }
}