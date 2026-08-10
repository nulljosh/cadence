import SwiftUI

@main
struct CadenceApp: App {
    var body: some Scene {
        WindowGroup {
            DashboardView()
                .frame(minWidth: 700, minHeight: 500)
        }
    }
}
