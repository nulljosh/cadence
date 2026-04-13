import Foundation

struct Stats: Codable {
    let total30: Int
    let activeProjects: Int
    let bestDay: Int
    let streak: Int
    let daily: [String: Int]
}

struct Project: Codable, Identifiable {
    var id: String { name }
    let name: String
    let platform: String
    let lastCommitAgo: String
    let commits30: Int
    let status: String
}

struct CommitDay: Identifiable {
    let id: String
    let date: String
    let count: Int
}
