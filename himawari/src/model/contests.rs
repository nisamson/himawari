use chrono::Utc;
use crate::model::ItemId;
use crate::model::users::{Username};
use std::collections::BTreeSet;
use crate::db;
use rocket::futures::TryStreamExt;

#[derive(sqlx::FromRow, Clone, Debug, Serialize, Deserialize)]
pub struct Contest {
    pub id: ItemId,
    pub owner: Username,
    pub name: String,
    pub created: chrono::DateTime<Utc>
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
}