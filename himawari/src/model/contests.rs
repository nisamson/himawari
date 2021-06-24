use chrono::Utc;
use crate::model::ItemId;
use crate::model::users::{Username};
use std::collections::BTreeSet;
use crate::{db, api};
use rocket::futures::TryStreamExt;

use crate::secure::GuardedResource;
use crate::secure;
use crate::model::users::Info;
use rocket::http::Status;

#[derive(sqlx::FromRow, Clone, Debug, Serialize, Deserialize)]
pub struct Contest {
    pub id: ItemId,
    pub owner: Username,
    pub name: String,
    pub created: chrono::DateTime<Utc>,
}

impl Contest {
    pub async fn judges(&self) -> db::Result<BTreeSet<Username>> {
        let q: sqlx::query::QueryScalar<_, _, _> = sqlx::query_scalar!(
            r#"
            SELECT judge as "judge: Username" FROM contest_judges
            WHERE contest = $1
            ORDER BY judge;
            "#,
            *self.id
        );

        let mut judges: BTreeSet<_> = q.fetch(db::pool())
            .try_collect()
            .await?;
        judges.insert(self.owner.clone());
        Ok(judges)
    }

    pub async fn entries(&self) -> db::Result<BTreeSet<ItemId>> {
        let q = sqlx::query_scalar!(
            r#"
            SELECT id as "id: ItemId"
            FROM entries
            WHERE contest = $1
            ORDER BY id;
            "#,
            *self.id
        ).fetch(db::pool())
            .try_collect()
            .await?;
        Ok(q)
    }

    pub async fn load(id: ItemId) -> db::Result<Self> {
        let out = sqlx::query_as!(
            Contest,
            r#"
            SELECT id as "id: _", owner as "owner: _", name, created FROM contests WHERE id = $1;
            "#,
            *id
        ).fetch_one(db::pool())
            .await?;
        Ok(out)
    }

    pub async fn delete(id: ItemId) -> db::Result<()> {
        let res = sqlx::query!(
            r#"
            DELETE FROM contests WHERE id = $1;
            "#,
            *id
        ).execute(db::pool())
            .await?;

        if res.rows_affected() < 1 {
            return Err(db::Error::NotFound);
        }

        Ok(())
    }
}

#[async_trait::async_trait]
impl GuardedResource for Contest {
    type ResourceId = ItemId;

    async fn access_level(user: &Info, rid: &Self::ResourceId) -> api::Result<secure::Role> {
        let role: Option<secure::Role> = sqlx::query_scalar!(
            r#"
            SELECT role AS "role: secure::Role" FROM contest_access_for_user($1, $2);
            "#,
            &user.username,
            rid.as_ref()
        ).fetch_one(db::pool())
            .await?;

        let role = role.ok_or(Status::NotFound)?;

        Ok(role)
    }
}