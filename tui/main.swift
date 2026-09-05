import Foundation
import SwiftTUI

// ponytail: static render, not a live dashboard. `cadence-tui` prints stats once and
// exits, same as nimble-tui. Fetches directly rather than through NetworkManager to
// skip its UserDefaults caching, which a one-shot CLI run doesn't need.

let base = "https://cadence.heyitsmejosh.com"

func fetch<T: Decodable>(_ type: T.Type, path: String) async -> T? {
    guard let url = URL(string: base + path) else { return nil }
    return try? await JSONDecoder().decode(T.self, from: URLSession.shared.data(from: url).0)
}

struct StatsCard: View {
    let stats: Stats?
    let projects: [Project]

    var body: some View {
        VStack(alignment: .leading) {
            Text("Cadence").bold()
            if let stats {
                Text("30d commits: \(stats.total30)")
                Text("Active projects: \(stats.activeProjects)")
                Text("Streak: \(stats.streak) · best day: \(stats.bestDay)")
            } else {
                Text("Could not reach cadence.heyitsmejosh.com")
            }
            ForEach(projects.prefix(5)) { p in
                Text("\(p.name) — \(p.commits30) commits, \(p.lastCommitAgo)")
            }
        }
        .padding()
        .border()
    }
}

let semaphore = DispatchSemaphore(value: 0)
var stats: Stats?
var projects: [Project] = []
Task {
    stats = await fetch(Stats.self, path: "/api/stats")
    projects = await fetch([Project].self, path: "/api/projects") ?? []
    semaphore.signal()
}
semaphore.wait()

Application(rootView: StatsCard(stats: stats, projects: projects)).start()
