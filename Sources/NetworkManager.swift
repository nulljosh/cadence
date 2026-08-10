import Foundation

@MainActor
class NetworkManager: ObservableObject {
    static let shared = NetworkManager()

    @Published var stats: Stats?
    @Published var projects: [Project] = []
    @Published var heatmap: [CommitDay] = []
    @Published var isLoading = false
    @Published var error: String?
    @Published var lastUpdated: Date?

    private let base = "https://cadence.heyitsmejosh.com"
    private let defaults = UserDefaults.standard

    private init() { loadCache() }

    func load() async {
        isLoading = true
        error = nil
        await doLoad()
        if error != nil {
            try? await Task.sleep(nanoseconds: 2_000_000_000)
            error = nil
            await doLoad()
        }
        isLoading = false
    }

    private func doLoad() async {
        async let statsReq = fetch(Stats.self, path: "/api/stats")
        async let projectsReq = fetch([Project].self, path: "/api/projects")
        async let heatmapReq = fetchHeatmap()
        let (s, p, h) = await (statsReq, projectsReq, heatmapReq)
        if let s {
            stats = s
            projects = p ?? []
            heatmap = h
            lastUpdated = Date()
            saveCache()
        }
    }

    private func fetch<T: Decodable>(_ type: T.Type, path: String) async -> T? {
        guard let url = URL(string: base + path) else { return nil }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            self.error = error.localizedDescription
            return nil
        }
    }

    private func fetchHeatmap() async -> [CommitDay] {
        guard let url = URL(string: base + "/api/heatmap") else { return [] }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            let raw = try JSONDecoder().decode([String: Int].self, from: data)
            return raw.map { CommitDay(id: $0.key, date: $0.key, count: $0.value) }
                      .sorted { $0.date < $1.date }
        } catch {
            return []
        }
    }

    private func saveCache() {
        defaults.set(try? JSONEncoder().encode(stats), forKey: "cache.stats")
        defaults.set(try? JSONEncoder().encode(projects), forKey: "cache.projects")
        defaults.set(try? JSONEncoder().encode(heatmap), forKey: "cache.heatmap")
        defaults.set(lastUpdated, forKey: "cache.updated")
    }

    private func loadCache() {
        if let d = defaults.data(forKey: "cache.stats") { stats = try? JSONDecoder().decode(Stats.self, from: d) }
        if let d = defaults.data(forKey: "cache.projects") { projects = (try? JSONDecoder().decode([Project].self, from: d)) ?? [] }
        if let d = defaults.data(forKey: "cache.heatmap") { heatmap = (try? JSONDecoder().decode([CommitDay].self, from: d)) ?? [] }
        lastUpdated = defaults.object(forKey: "cache.updated") as? Date
    }
}
