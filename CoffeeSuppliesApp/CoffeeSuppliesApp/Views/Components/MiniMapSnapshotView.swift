import SwiftUI
import MapKit
import CoreLocation

/// A static map snapshot image for displaying a saved coordinate.
/// Uses MKMapSnapshotter to generate a simple image — avoids all MapKit
/// interactive widget lifecycle issues that plague SwiftUI's Map view.
struct MiniMapSnapshotView: View {
    let coordinate: CLLocationCoordinate2D
    @State private var snapshotImage: UIImage?

    var body: some View {
        Group {
            if let image = snapshotImage {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } else {
                RoundedRectangle(cornerRadius: Shape.inputRadius)
                    .fill(Color.stone100)
                    .overlay {
                        ProgressView()
                    }
            }
        }
        .id("\(coordinate.latitude),\(coordinate.longitude)")
        .task(id: "\(coordinate.latitude),\(coordinate.longitude)") {
            await generateSnapshot()
        }
    }

    private func generateSnapshot() async {
        let options = MKMapSnapshotter.Options()
        options.region = MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.005, longitudeDelta: 0.005)
        )
        options.size = CGSize(width: 400, height: 200)
        options.mapType = .standard
        options.showsBuildings = true

        let snapshotter = MKMapSnapshotter(options: options)

        do {
            let snapshot = try await snapshotter.start()
            guard !Task.isCancelled else { return }

            let image = UIGraphicsImageRenderer(size: snapshot.image.size).image { _ in
                snapshot.image.draw(at: .zero)

                let pinPoint = snapshot.point(for: coordinate)

                // Draw a circle marker at the coordinate
                let circleDiameter: CGFloat = 14
                let circleRect = CGRect(
                    x: pinPoint.x - circleDiameter / 2,
                    y: pinPoint.y - circleDiameter / 2,
                    width: circleDiameter,
                    height: circleDiameter
                )

                // Outer ring
                UIColor.systemBrown.setFill()
                UIBezierPath(ovalIn: circleRect.insetBy(dx: -3, dy: -3)).fill()

                // Inner white circle
                UIColor.white.setFill()
                UIBezierPath(ovalIn: circleRect).fill()

                // Center dot
                let dotRect = circleRect.insetBy(dx: 3, dy: 3)
                UIColor.systemBrown.setFill()
                UIBezierPath(ovalIn: dotRect).fill()
            }
            self.snapshotImage = image
        } catch {
            // Silently fail — the placeholder stays visible
        }
    }
}
