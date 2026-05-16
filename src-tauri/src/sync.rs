use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncStatus {
    pub is_syncing: bool,
    pub last_sync_at: Option<String>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerData {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub title: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageData {
    pub id: String,
    pub title: String,
    pub content: String,
    pub containers: Vec<ContainerData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SectionData {
    pub id: String,
    pub name: String,
    pub pages: Vec<PageData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotebookData {
    pub id: String,
    pub name: String,
    pub sections: Vec<SectionData>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncPayload {
    pub notebooks: Vec<NotebookData>,
    pub synced_at: String,
}

pub struct SyncWorker {
    status: Mutex<SyncStatus>,
}

impl SyncWorker {
    pub fn new() -> Self {
        Self {
            status: Mutex::new(SyncStatus {
                is_syncing: false,
                last_sync_at: None,
                error: None,
            }),
        }
    }

    pub fn status(&self) -> Result<SyncStatus, String> {
        self.status
            .lock()
            .map(|status| SyncStatus {
                is_syncing: status.is_syncing,
                last_sync_at: status.last_sync_at.clone(),
                error: status.error.clone(),
            })
            .map_err(|_| "Unable to acquire sync status lock".to_string())
    }

    pub async fn run_sync(&self, notebooks: Vec<NotebookData>) -> Result<SyncPayload, String> {
        {
            let mut status = self
                .status
                .lock()
                .map_err(|_| "Unable to acquire sync lock".to_string())?;
            status.is_syncing = true;
            status.error = None;
        }

        let synced_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| "Unable to determine current time".to_string())?
            .as_secs()
            .to_string();

        let normalized_notebooks = notebooks
            .into_iter()
            .map(|notebook| NotebookData {
                id: notebook.id,
                name: notebook.name.trim().to_string(),
                sections: notebook
                    .sections
                    .into_iter()
                    .map(|section| SectionData {
                        id: section.id,
                        name: section.name.trim().to_string(),
                        pages: section
                            .pages
                            .into_iter()
                            .map(|page| PageData {
                                id: page.id,
                                title: page.title.trim().to_string(),
                                content: page.content,
                                containers: page.containers,
                            })
                            .collect(),
                    })
                    .collect(),
            })
            .collect();

        {
            let mut status = self
                .status
                .lock()
                .map_err(|_| "Unable to acquire sync lock".to_string())?;
            status.is_syncing = false;
            status.last_sync_at = Some(synced_at.clone());
            status.error = None;
        }

        Ok(SyncPayload {
            notebooks: normalized_notebooks,
            synced_at,
        })
    }

    pub async fn import_from_onenote(&self, access_token: String) -> Result<SyncPayload, String> {
        {
            let mut status = self
                .status
                .lock()
                .map_err(|_| "Unable to acquire sync lock".to_string())?;
            status.is_syncing = true;
            status.error = None;
        }

        let result = fetch_onenote_notebooks(&access_token).await;
        let synced_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map_err(|_| "Unable to determine current time".to_string())?
            .as_secs()
            .to_string();

        let payload = match result {
            Ok(notebooks) => SyncPayload {
                notebooks,
                synced_at: synced_at.clone(),
            },
            Err(error) => {
                let mut status = self
                    .status
                    .lock()
                    .map_err(|_| "Unable to acquire sync lock".to_string())?;
                status.is_syncing = false;
                status.error = Some(error.clone());
                return Err(error);
            }
        };

        {
            let mut status = self
                .status
                .lock()
                .map_err(|_| "Unable to acquire sync lock".to_string())?;
            status.is_syncing = false;
            status.last_sync_at = Some(payload.synced_at.clone());
            status.error = None;
        }

        Ok(payload)
    }
}

async fn fetch_json(client: &reqwest::Client, url: &str, access_token: &str) -> Result<Value, String> {
    client
        .get(url)
        .bearer_auth(access_token)
        .send()
        .await
        .map_err(|error| format!("Network error while contacting Microsoft Graph: {error}"))?
        .error_for_status()
        .map_err(|error| format!("Microsoft Graph request failed: {error}"))?
        .json::<Value>()
        .await
        .map_err(|error| format!("Invalid Microsoft Graph response: {error}"))
}

fn value_str(value: &Value, field: &str) -> Option<String> {
    value.get(field)?.as_str().map(ToOwned::to_owned)
}

async fn fetch_onenote_notebooks(access_token: &str) -> Result<Vec<NotebookData>, String> {
    let client = reqwest::Client::new();
    let notebooks_json = fetch_json(
        &client,
        "https://graph.microsoft.com/v1.0/me/onenote/notebooks?$select=id,displayName",
        access_token,
    )
    .await?;

    let notebooks = notebooks_json
        .get("value")
        .and_then(Value::as_array)
        .ok_or_else(|| "Unexpected OneNote notebooks response format".to_string())?;

    let mut mapped_notebooks = Vec::new();
    for notebook in notebooks {
        let notebook_id =
            value_str(notebook, "id").ok_or_else(|| "OneNote notebook response missing id".to_string())?;
        let notebook_name = value_str(notebook, "displayName").unwrap_or_else(|| "Notebook".to_string());

        let sections_url = format!(
            "https://graph.microsoft.com/v1.0/me/onenote/notebooks/{}/sections?$select=id,displayName",
            notebook_id
        );
        let sections_json = fetch_json(&client, &sections_url, access_token).await?;
        let sections = sections_json
            .get("value")
            .and_then(Value::as_array)
            .ok_or_else(|| "Unexpected OneNote sections response format".to_string())?;

        let mut mapped_sections = Vec::new();
        for section in sections {
            let section_id =
                value_str(section, "id").ok_or_else(|| "OneNote section response missing id".to_string())?;
            let section_name = value_str(section, "displayName").unwrap_or_else(|| "Section".to_string());

            let pages_url = format!(
                "https://graph.microsoft.com/v1.0/me/onenote/sections/{}/pages?$select=id,title",
                section_id
            );
            let pages_json = fetch_json(&client, &pages_url, access_token).await?;
            let pages = pages_json
                .get("value")
                .and_then(Value::as_array)
                .ok_or_else(|| "Unexpected OneNote pages response format".to_string())?;

            let mapped_pages = pages
                .iter()
                .map(|page| {
                    let page_id = value_str(page, "id")
                        .unwrap_or_else(|| format!("page-{}", SystemTime::now().duration_since(UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0)));
                    let page_title = value_str(page, "title").unwrap_or_else(|| "Untitled Page".to_string());
                    PageData {
                        id: page_id.clone(),
                        title: page_title.clone(),
                        content: format!("Imported OneNote page: {page_title}"),
                        containers: vec![ContainerData {
                            id: format!("import-note-{page_id}"),
                            x: 120.0,
                            y: 100.0,
                            title: page_title.clone(),
                            content: "<p>Imported from OneNote. Start editing here.</p>".to_string(),
                        }],
                    }
                })
                .collect::<Vec<_>>();

            mapped_sections.push(SectionData {
                id: section_id,
                name: section_name,
                pages: if mapped_pages.is_empty() {
                    vec![PageData {
                        id: "empty-page".to_string(),
                        title: "Untitled Page".to_string(),
                        content: String::new(),
                        containers: vec![],
                    }]
                } else {
                    mapped_pages
                },
            });
        }

        mapped_notebooks.push(NotebookData {
            id: notebook_id,
            name: notebook_name,
            sections: if mapped_sections.is_empty() {
                vec![SectionData {
                    id: "empty-section".to_string(),
                    name: "General".to_string(),
                    pages: vec![PageData {
                        id: "empty-page".to_string(),
                        title: "Untitled Page".to_string(),
                        content: String::new(),
                        containers: vec![],
                    }],
                }]
            } else {
                mapped_sections
            },
        });
    }

    Ok(mapped_notebooks)
}
