import SwiftUI
import Charts

struct DashboardView: View {
    @ObservedObject var net = NetworkManager.shared

    var chartData: [(day: String, count: Int)] {
        guard let daily = net.stats?.daily else { return [] }
        let cal = Calendar.current
        let now = Date()
        return (0..<30).reversed().map { offset in
            let date = cal.date(byAdding: .day, value: -offset, to: now)!
            let key = ISO8601DateFormatter().string(from: date).prefix(10)
            let label = date.formatted(.dateTime.month(.abbreviated).day())
            return (day: label, count: daily[String(key)] ?? 0)
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 32) {

                // Header
                VStack(alignment: .leading, spacing: 4) {
                    Text("Cadence")
                        .font(.system(size: 40, weight: .ultraLight, design: .default))
                        .tracking(-1)
                    if let streak = net.stats?.streak {
                        Text("\(streak)-day streak")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)
                            .tracking(1)
                    }
                }

                // Stat cards
                if let s = net.stats {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 1) {
                        StatCell(label: "Commits 30d", value: "\(s.total30.formatted())")
                        StatCell(label: "Repos", value: "\(s.activeProjects)")
                        StatCell(label: "Best Day", value: "\(s.bestDay)")
                        StatCell(label: "Streak", value: "\(s.streak)")
                    }
                    .overlay(RoundedRectangle(cornerRadius: 0).stroke(Color.primary.opacity(0.1), lineWidth: 1))
                }

                // Commit chart
                SectionLabel("Commit Activity")
                Chart(chartData, id: \.day) { item in
                    BarMark(
                        x: .value("Day", item.day),
                        y: .value("Commits", item.count)
                    )
                    .foregroundStyle(Color.primary.opacity(0.3))
                    .cornerRadius(3)
                }
                .frame(height: 140)
                .chartXAxis {
                    AxisMarks(values: .stride(by: 5)) { _ in
                        AxisTick(stroke: StrokeStyle(lineWidth: 0))
                        AxisValueLabel().font(.system(size: 9)).foregroundStyle(Color.secondary)
                    }
                }
                .chartYAxis {
                    AxisMarks { _ in
                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5)).foregroundStyle(Color.primary.opacity(0.07))
                        AxisValueLabel().font(.system(size: 9)).foregroundStyle(Color.secondary)
                    }
                }

                // Heatmap
                SectionLabel("Activity Grid")
                HeatmapView()

                // Projects
                SectionLabel("Projects")
                ProjectListView()
            }
            .padding(24)
        }
        .task { await net.load() }
    }
}

struct StatCell: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(value)
                .font(.system(size: 32, weight: .ultraLight, design: .default))
                .tracking(-1)
            Text(label)
                .font(.system(size: 10, weight: .medium))
                .foregroundStyle(.tertiary)
                .textCase(.uppercase)
                .tracking(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .overlay(Rectangle().stroke(Color.primary.opacity(0.07), lineWidth: 0.5))
    }
}

struct SectionLabel: View {
    let text: String
    init(_ text: String) { self.text = text }
    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .medium))
            .foregroundStyle(.tertiary)
            .textCase(.uppercase)
            .tracking(1.2)
    }
}
