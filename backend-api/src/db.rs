// OptiTask/backend-api/src/db.rs
// Gardons notre structure actuelle de pool, mais notons comment votre exemple le faisait.
// Notre pool est créé dans main.rs et injecté.
// La gestion d'erreur via `ServiceError` se fera dans les handlers.

use diesel::pg::PgConnection;
use diesel::r2d2::{self, ConnectionManager}; // Gardez r2d2 ici
use dotenvy::dotenv;
use std::env;

// Type alias pour le pool, comme avant
pub type DbPool = r2d2::Pool<ConnectionManager<PgConnection>>;

// Fonction pour établir le pool (appelée depuis main.rs)
pub fn establish_connection_pool() -> DbPool {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");
    let manager = ConnectionManager::<PgConnection>::new(database_url);
    r2d2::Pool::builder()
        .build(manager)
        .expect("Failed to create database connection pool.")
}

// Nous n'avons pas besoin d'une fonction `connection()` séparée ici
// car nous injectons `web::Data<DbPool>` dans les handlers, et
// les handlers obtiennent une connexion du pool via `pool.get()`.
// La conversion de `r2d2::Error` en `ServiceError` se fera dans
// la closure de `web::block` dans chaque handler.
