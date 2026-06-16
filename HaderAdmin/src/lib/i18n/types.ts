/**
 * Locale identifiers supported by the admin dashboard.
 * Arabic is the primary/default language (matching the iOS app).
 */
export type Locale = "ar" | "en";

/** The full shape of a translation dictionary. */
export interface TranslationDictionary {
  // Direction
  dir: "rtl" | "ltr";

  // Common / General
  general: {
    appName: string;
    appTagline: string;
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    save: string;
    delete: string;
    confirm: string;
    search: string;
    noResults: string;
    actions: string;
    back: string;
    close: string;
    edit: string;
    create: string;
    add: string;
    remove: string;
    yes: string;
    no: string;
    all: string;
    active: string;
    required: string;
  };

  // Navigation / Sidebar
  nav: {
    orders: string;
    catalog: string;
    suppliers: string;
    customers: string;
    analytics: string;
    signOut: string;
    signedIn: string;
  };

  // Auth / Login
  auth: {
    title: string;
    subtitle: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    signIn: string;
    signingIn: string;
    notAdmin: string;
    errors: {
      invalidEmail: string;
      userNotFound: string;
      wrongPassword: string;
      invalidCredential: string;
      tooManyRequests: string;
      generic: string;
    };
  };

  // Orders
  orders: {
    title: string;
    description: string;
    filters: {
      all: string;
      active: string;
      cancelled: string;
    };
    table: {
      order: string;
      business: string;
      items: string;
      total: string;
      payment: string;
      status: string;
      created: string;
      location: string;
      map: string;
    };
    detail: {
      title: string;
      backToOrders: string;
      orderItems: string;
      deliveryAddress: string;
      paymentMethod: string;
      updateStatus: string;
      quantity: string;
      unitPrice: string;
      lineTotal: string;
      district: string;
      street: string;
      notes: string;
      coordinates: string;
      viewOnMap: string;
      statusHistory: string;
    };
    status: {
      pending: string;
      sent_to_supplier: string;
      delivered: string;
      cancelled: string;
    };
    payment: {
      apple_pay: string;
      cash_on_delivery: string;
    };
    empty: string;
    loadError: string;
    confirmStatusChange: string;
  };

  // Catalog
  catalog: {
    title: string;
    description: string;
    categories: {
      title: string;
      description: string;
      nameAr: string;
      nameEn: string;
      sortOrder: string;
      addCategory: string;
      editCategory: string;
      deleteConfirm: string;
      empty: string;
    };
    products: {
      title: string;
      description: string;
      addProduct: string;
      editProduct: string;
      deleteConfirm: string;
      empty: string;
      nameAr: string;
      nameEn: string;
      descriptionAr: string;
      descriptionEn: string;
      category: string;
      price: string;
      pricingUnit: string;
      deliveryEstimate: string;
      inStock: string;
      outOfStock: string;
      madeToOrder: string;
      supplierCostPrice: string;
      supplier: string;
      image: string;
      uploadImage: string;
      variants: string;
      addVariant: string;
      variantLabelAr: string;
      variantLabelEn: string;
      variantPrice: string;
      variantStock: string;
      searchPlaceholder: string;
      allCategories: string;
    };
  };

  // Suppliers
  suppliers: {
    title: string;
    description: string;
    addSupplier: string;
    editSupplier: string;
    deleteConfirm: string;
    empty: string;
    name: string;
    phone: string;
    email: string;
    handlesNote: string;
    linkedProducts: string;
  };

  // Customers
  customers: {
    title: string;
    description: string;
    addCustomer: string;
    empty: string;
    filters: {
      all: string;
      pending: string;
      approved: string;
      suspended: string;
    };
    fields: {
      businessName: string;
      contactName: string;
      phone: string;
      email: string;
      status: string;
      createdAt: string;
      deliveryAddress: string;
    };
    actions: {
      approve: string;
      suspend: string;
      approveConfirm: string;
      suspendConfirm: string;
    };
  };

  // Analytics
  analytics: {
    title: string;
    description: string;
    totalOrders: string;
    totalRevenue: string;
    ordersByStatus: string;
    topProducts: string;
    byQuantity: string;
    byRevenue: string;
    ordersBySupplier: string;
    estimatedProfit: string;
    noData: string;
    product: string;
    quantity: string;
    revenue: string;
    supplier: string;
    orderCount: string;
  };

  // Language
  language: {
    toggle: string;
    arabic: string;
    english: string;
  };
}
