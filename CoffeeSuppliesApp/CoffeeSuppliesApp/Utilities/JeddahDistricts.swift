import Foundation

/// A Jeddah district with bilingual labels.
struct District: Identifiable, Equatable, Hashable {
    let id: String
    let nameAr: String
    let nameEn: String

    /// Resolved name based on the current language.
    var localizedName: String {
        LanguageManager.shared.resolve(ar: nameAr, en: nameEn)
    }
}

/// Controlled list of Jeddah districts for the delivery address selector
/// (see Phase1-Resolved-Decisions §2). Presented as a flat list, Arabic primary.
/// "Other" lets customers in unlisted/new districts proceed without being blocked.
enum JeddahDistricts {
    static let all: [District] = [
        District(id: "al_hamra", nameAr: "الحمراء", nameEn: "Al Hamra"),
        District(id: "al_rawdah", nameAr: "الروضة", nameEn: "Al Rawdah"),
        District(id: "al_zahra", nameAr: "الزهراء", nameEn: "Al Zahra"),
        District(id: "al_shati", nameAr: "الشاطئ", nameEn: "Al Shati"),
        District(id: "al_salamah", nameAr: "السلامة", nameEn: "Al Salamah"),
        District(id: "al_mohammadiyah", nameAr: "المحمدية", nameEn: "Al Mohammadiyah"),
        District(id: "al_nuzha", nameAr: "النزهة", nameEn: "Al Nuzha"),
        District(id: "al_nahdah", nameAr: "النهضة", nameEn: "Al Nahdah"),
        District(id: "al_andalus", nameAr: "الأندلس", nameEn: "Al Andalus"),
        District(id: "al_faisaliyah", nameAr: "الفيصلية", nameEn: "Al Faisaliyah"),
        District(id: "al_rabwah", nameAr: "الربوة", nameEn: "Al Rabwah"),
        District(id: "al_marwah", nameAr: "المروة", nameEn: "Al Marwah"),
        District(id: "al_safa", nameAr: "الصفا", nameEn: "Al Safa"),
        District(id: "al_balad", nameAr: "البلد", nameEn: "Al Balad"),
        District(id: "al_rehab", nameAr: "الرحاب", nameEn: "Al Rehab"),
        District(id: "obhur_north", nameAr: "أبحر الشمالية", nameEn: "Obhur (North)"),
        District(id: "obhur_south", nameAr: "أبحر الجنوبية", nameEn: "Obhur (South)"),
        District(id: "al_khalidiyah", nameAr: "الخالدية", nameEn: "Al Khalidiyah"),
        District(id: "al_baghdadiyah", nameAr: "البغدادية", nameEn: "Al Baghdadiyah"),
        District(id: "al_manar", nameAr: "المنار", nameEn: "Al Manar"),
        District(id: "al_rawabi", nameAr: "الروابي", nameEn: "Al Rawabi"),
        District(id: "al_ruwais", nameAr: "الرويس", nameEn: "Al Ruwais"),
        District(id: "bani_malik", nameAr: "بني مالك", nameEn: "Bani Malik"),
        District(id: "al_sulaymaniyyah", nameAr: "السليمانية", nameEn: "Al Sulaymaniyyah"),
        District(id: "al_aziziyyah", nameAr: "العزيزية", nameEn: "Al Aziziyyah"),
        District(id: "al_murjan", nameAr: "المرجان", nameEn: "Al Murjan"),
        District(id: "al_sharafiyah", nameAr: "الشرفية", nameEn: "Al Sharafiyah"),
        District(id: "al_wurud", nameAr: "الورود", nameEn: "Al Wurud"),
        District(id: "al_hamdaniyah", nameAr: "الحمدانية", nameEn: "Al Hamdaniyah"),
        District(id: "al_yaqout", nameAr: "الياقوت", nameEn: "Al Yaqout"),
        District(id: "taibah", nameAr: "طيبة", nameEn: "Taibah"),
        District(id: "prince_fawaz", nameAr: "الأمير فواز", nameEn: "Prince Fawaz"),
        District(id: "durrat_al_arus", nameAr: "درة العروس", nameEn: "Durrat Al Arus"),
        District(id: "other", nameAr: "أخرى", nameEn: "Other"),
    ]

    /// The fallback "Other" district.
    static var other: District {
        all.last!
    }
}
