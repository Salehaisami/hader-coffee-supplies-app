// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CoffeeSuppliesApp",
    platforms: [.iOS(.v17)],
    dependencies: [
        .package(url: "https://github.com/firebase/firebase-ios-sdk.git", from: "11.0.0"),
        .package(url: "https://github.com/pointfreeco/swift-snapshot-testing.git", from: "1.15.0"),
    ],
    targets: [
        .target(
            name: "CoffeeSuppliesApp",
            dependencies: [
                .product(name: "FirebaseFirestore", package: "firebase-ios-sdk"),
                .product(name: "FirebaseAuth", package: "firebase-ios-sdk"),
                .product(name: "FirebaseStorage", package: "firebase-ios-sdk"),
                .product(name: "FirebaseFunctions", package: "firebase-ios-sdk"),
                .product(name: "FirebaseMessaging", package: "firebase-ios-sdk"),
            ]
        ),
        .testTarget(
            name: "CoffeeSuppliesAppTests",
            dependencies: [
                "CoffeeSuppliesApp",
                .product(name: "SnapshotTesting", package: "swift-snapshot-testing"),
            ]
        ),
    ]
)
