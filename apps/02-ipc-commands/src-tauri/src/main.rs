#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ipc_commands_lib::run()
}
