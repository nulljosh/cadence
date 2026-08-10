import Foundation

struct Stats: Codable {
    let total30: Int
    let activeProjects: Int
    let bestDay: Int
    let streak: Int
    let daily: [String: Int]
    let perRepo: [String: Int]
}

struct Project: Codable, Identifiable {
    var id: String { name }
    let name: String
    let lastCommitAgo: String
    let commits30: Int
    let status: String
}

struct CommitDay: Codable, Identifiable {
    let id: String
    let date: String
    let count: Int
}
