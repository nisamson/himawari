use sqlx::Postgres;
use crate::api;
use crate::model::users;
use rocket::http::Status;
use std::borrow::Cow;

#[derive(Debug, Clone, PartialEq, thiserror::Error)]
pub enum Error {
    #[error("Your role must be at least {0} to do that action.")]
    MustBeAtLeast(Role),
}

#[derive(sqlx::Type, Debug, Clone, PartialEq, Serialize, Deserialize, Ord, PartialOrd, Eq, Hash)]
#[sqlx(type_name = "access_role", rename_all = "lowercase")]
pub enum Role {
    None,
    Collaborator,
    Owner,
    Moderator,
    Admin
}

serde_plain::forward_display_to_serde!(Role);

#[async_trait::async_trait]
pub trait GuardedResource {
    type ResourceId;

    async fn access_level(user: &users::Info, rid: &Self::ResourceId) -> api::Result<Role>;
}

impl Role {
    pub fn ensure_at_least(&self, other: Role) -> Result<(), Error> {
        if self < &other {
            Err(Error::MustBeAtLeast(other))
        } else {
            Ok(())
        }
    }
}

impl api::ResponseError for Error {
    fn status(&self) -> Status {
        Status::Forbidden
    }

    fn message(&self) -> Cow<'static, str> {
        self.to_string().into()
    }
}