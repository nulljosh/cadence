import SwiftUI

struct ProjectListView: View {
    @ObservedObject var net = NetworkManager.shared

    var body: some View {
        VStack(spacing: 0) {
            Divider()
            ForEach(net.projects) { project in
                HStack(alignment: .center) {
                    Circle()
                        .fill(statusColor(project.status))
                        .frame(width: 5, height: 5)
                    Text(project.name)
                        .font(.system(size: 14, weight: .medium))
                    Spacer()
                    Text(project.lastCommitAgo)
                        .font(.system(size: 12))
                        .foregroundStyle(.tertiary)
                    Text("\(project.commits30)")
                        .font(.system(size: 14, weight: .medium))
                        .frame(minWidth: 28, alignment: .trailing)
                }
                .padding(.vertical, 10)
                Divider()
            }
        }
    }

    func statusColor(_ status: String) -> Color {
        switch status {
        case "active": return Color.primary.opacity(0.7)
        case "stable": return Color.primary.opacity(0.35)
        default: return Color.primary.opacity(0.15)
        }
    }
}
