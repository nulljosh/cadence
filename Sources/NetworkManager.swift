import Foundation

@MainActor
class NetworkManager: ObservableObject {
    static let shared = NetworkManager()

    @Published var stats: Stats?
    @Published var projects: [Project] = []
    @Published var heatmap: [CommitDay] = []
    @Published var isLoading = false
    @Published var error: String?

    private let base = "https://cadence.heyitsmejosh.com"

    func load() async {
        isLoading = true
        error = nil
        async let statsReq = fetch(Stats.self, path: "/api/stats")
        async let projectsReq = fetch([Project].self, path: "/api/projects")
        async let heatmapReq = fetchHeatmap()
        let (s, p, h) = await (statsReq, projectsReq, heatmapReq)
        stats = s
        projects = p ?? []
        heatmap = h
        isLoading = false
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
}
