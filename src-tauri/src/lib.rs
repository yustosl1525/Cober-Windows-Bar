use serde::Serialize;
use serde_json::{json, Value};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HubEventFixture {
  id: String,
  #[serde(rename = "type")]
  event_type: String,
  source: String,
  created_at: u64,
  progress: Option<u8>,
  payload: Value,
  metadata: Value,
}

#[tauri::command]
fn get_hub_event_fixtures() -> Vec<HubEventFixture> {
  vec![HubEventFixture {
    id: "tauri-fixture-ai-1780743600000".into(),
    event_type: "ai".into(),
    source: "mock".into(),
    created_at: 1_780_743_600_000,
    progress: Some(64),
    payload: json!({
      "id": "tauri-fixture-ai-task",
      "type": "ai",
      "title": "Tauri IPC fixture",
      "subtitle": "Boundary smoke event from native fixture command",
      "progress": 64,
      "accent": "blue"
    }),
    metadata: json!({
      "runtime": "tauri",
      "fixture": true,
      "version": "0.7.0"
    }),
  }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![get_hub_event_fixtures])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
