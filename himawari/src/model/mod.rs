pub mod users;
pub mod contests;

#[derive(sqlx::Type, Debug,  PartialOrd, Ord, Serialize, Deserialize, Copy, Clone, Eq, PartialEq, Hash, shrinkwraprs::Shrinkwrap)]
#[sqlx(transparent)]
pub struct ItemId(i64);