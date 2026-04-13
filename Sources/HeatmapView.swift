import SwiftUI

struct HeatmapView: View {
    @ObservedObject var net = NetworkManager.shared

    private let cols = 26
    private let rows = 7
    private let cellSize: CGFloat = 11
    private let gap: CGFloat = 3

    var cells: [(date: String, count: Int)] {
        let cal = Calendar.current
        let now = Date()
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        let lookup = Dictionary(uniqueKeysWithValues: net.heatmap.map { ($0.date, $0.count) })
        return (0..<182).reversed().map { offset in
            let date = cal.date(byAdding: .day, value: -offset, to: now)!
            let key = fmt.string(from: date)
            return (date: key, count: lookup[key] ?? 0)
        }
    }

    var maxCount: Int { cells.map(\.count).max() ?? 1 }

    func level(_ count: Int) -> Double {
        guard maxCount > 0, count > 0 else { return 0 }
        return Double(count) / Double(maxCount)
    }

    var body: some View {
        LazyVGrid(
            columns: Array(repeating: GridItem(.fixed(cellSize), spacing: gap), count: cols),
            spacing: gap
        ) {
            ForEach(cells, id: \.date) { cell in
                let l = level(cell.count)
                RoundedRectangle(cornerRadius: 2)
                    .fill(Color.primary.opacity(cell.count == 0 ? 0.07 : l < 0.25 ? 0.18 : l < 0.5 ? 0.38 : l < 0.75 ? 0.62 : 0.9))
                    .frame(width: cellSize, height: cellSize)
                    .help("\(cell.date): \(cell.count) commits")
            }
        }
    }
}
