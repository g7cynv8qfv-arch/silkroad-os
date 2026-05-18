import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SilkRoute OS demo data…');

  // ── Wipe in dependency order ──────────────────────────────────────────────
  await prisma.aiAssistantMessage.deleteMany();
  await prisma.aiAssistantConversation.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.qualityCheck.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.intelligenceReport.deleteMany();
  await prisma.supplierInteraction.deleteMany();
  await prisma.supplierAttachment.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.supplierContact.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // ── Organization ──────────────────────────────────────────────────────────
  const org = await prisma.organization.create({
    data: {
      clerkOrgId: 'demo_org_silkroute_001',
      name: 'SilkRoute Demo',
      slug: 'silkroute-demo',
      plan: 'PRO',
    },
  });
  console.log(`  ✓ org: ${org.name}`);

  // ── Users ─────────────────────────────────────────────────────────────────
  const alice = await prisma.user.create({
    data: {
      clerkUserId: 'demo_user_alice_001',
      email: 'alice@silkroute-demo.com',
      firstName: 'Alice',
      lastName: 'Martin',
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Alice+Martin',
    },
  });

  const bob = await prisma.user.create({
    data: {
      clerkUserId: 'demo_user_bob_001',
      email: 'bob@silkroute-demo.com',
      firstName: 'Bob',
      lastName: 'Chen',
      avatarUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Bob+Chen',
    },
  });
  console.log(`  ✓ users: ${alice.firstName}, ${bob.firstName}`);

  // ── Memberships ───────────────────────────────────────────────────────────
  await prisma.membership.createMany({
    data: [
      { userId: alice.id, organizationId: org.id, role: 'OWNER' },
      { userId: bob.id, organizationId: org.id, role: 'MEMBER' },
    ],
  });

  // ── Suppliers ─────────────────────────────────────────────────────────────
  const s1 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Shenzhen Tech Manufacturing Co.',
      country: 'CN',
      city: 'Shenzhen',
      websiteUrl: 'https://www.sz-tech-mfg.example.com',
      alibabaUrl: 'https://sztechmfg.en.alibaba.com',
      mainCategory: 'Electronics & Components',
      yearEstablished: 2008,
      employeeCount: 450,
      certifications: ['ISO 9001', 'CE', 'RoHS'],
      rating: 4.6,
      riskScore: 2.8,
      status: 'ACTIVE',
      notes: 'Primary electronics supplier. Strong QC processes, reliable delivery.',
    },
  });

  const s2 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Guangzhou Textiles Ltd.',
      country: 'CN',
      city: 'Guangzhou',
      websiteUrl: 'https://www.gz-textiles.example.com',
      mainCategory: 'Apparel & Textiles',
      yearEstablished: 2012,
      employeeCount: 280,
      certifications: ['OEKO-TEX', 'BSCI'],
      rating: 4.2,
      riskScore: 3.5,
      status: 'ACTIVE',
      notes: 'Good for seasonal orders. MOQ negotiable above 500 units.',
    },
  });

  const s3 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Yiwu Global Trading Co.',
      country: 'CN',
      city: 'Yiwu',
      alibabaUrl: 'https://yiwuglobal.en.alibaba.com',
      the1688Url: 'https://yiwuglobal.1688.com',
      mainCategory: 'General Merchandise',
      yearEstablished: 2015,
      employeeCount: 85,
      certifications: ['ISO 9001'],
      rating: 3.9,
      riskScore: 4.1,
      status: 'ACTIVE',
      notes: 'Wide product range. Best for small MOQ mixed orders.',
    },
  });

  const s4 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Dongguan Precision Parts',
      country: 'CN',
      city: 'Dongguan',
      websiteUrl: 'https://www.dg-precision.example.com',
      mainCategory: 'Industrial Parts & Machinery',
      yearEstablished: 2005,
      employeeCount: 620,
      certifications: ['ISO 9001', 'ISO 14001', 'TS 16949'],
      rating: 4.8,
      riskScore: 2.1,
      status: 'ACTIVE',
      notes: 'Best-in-class CNC precision. 15+ year relationship. Priority partner.',
    },
  });

  const s5 = await prisma.supplier.create({
    data: {
      organizationId: org.id,
      name: 'Shanghai Premium Goods',
      country: 'CN',
      city: 'Shanghai',
      mainCategory: 'Packaging & Food Products',
      yearEstablished: 2018,
      employeeCount: 95,
      certifications: ['FDA', 'HACCP'],
      rating: 3.2,
      riskScore: 7.4,
      status: 'ARCHIVED',
      notes: 'Archived after failed QC audit in Q3 2024. Do not reactivate without new audit.',
    },
  });
  console.log(`  ✓ suppliers: ${[s1, s2, s3, s4, s5].map((s) => s.name).join(', ')}`);

  // ── Supplier Contacts ─────────────────────────────────────────────────────
  await prisma.supplierContact.createMany({
    data: [
      // Shenzhen Tech
      {
        organizationId: org.id,
        supplierId: s1.id,
        name: 'Li Wei',
        role: 'Sales Manager',
        email: 'li.wei@sz-tech.example.com',
        phone: '+86 755 8888 0001',
        wechat: 'liwei_sz',
        isPrimary: true,
      },
      {
        organizationId: org.id,
        supplierId: s1.id,
        name: 'Chen Fang',
        role: 'QC Director',
        email: 'chen.fang@sz-tech.example.com',
        phone: '+86 755 8888 0002',
        isPrimary: false,
      },
      // Guangzhou Textiles
      {
        organizationId: org.id,
        supplierId: s2.id,
        name: 'Wang Mei',
        role: 'Export Manager',
        email: 'wang.mei@gz-textiles.example.com',
        phone: '+86 020 9999 0001',
        whatsapp: '+8613900139001',
        isPrimary: true,
      },
      // Yiwu
      {
        organizationId: org.id,
        supplierId: s3.id,
        name: 'Zhang Lei',
        role: 'Account Manager',
        email: 'zhang.lei@yiwuglobal.example.com',
        phone: '+86 579 8888 0001',
        wechat: 'zhanglei_yw',
        isPrimary: true,
      },
      // Dongguan
      {
        organizationId: org.id,
        supplierId: s4.id,
        name: 'Liu Jianhua',
        role: 'Technical Director',
        email: 'liu.jh@dg-precision.example.com',
        phone: '+86 769 8888 0001',
        isPrimary: true,
      },
      {
        organizationId: org.id,
        supplierId: s4.id,
        name: 'Huang Ying',
        role: 'Account Executive',
        email: 'huang.y@dg-precision.example.com',
        phone: '+86 769 8888 0002',
        wechat: 'huangying_dg',
        isPrimary: false,
      },
      // Shanghai (archived)
      {
        organizationId: org.id,
        supplierId: s5.id,
        name: 'Sun Bo',
        role: 'Sales Representative',
        email: 'sun.bo@sh-premium.example.com',
        phone: '+86 21 8888 0001',
        isPrimary: true,
      },
    ],
  });

  // ── Supplier Products ─────────────────────────────────────────────────────
  await prisma.supplierProduct.createMany({
    data: [
      // Shenzhen Tech
      {
        organizationId: org.id,
        supplierId: s1.id,
        name: 'USB-C Power Module 65W',
        sku: 'SZ-PWR-65W',
        moq: 500,
        unitPriceCents: 1250,
        currency: 'USD',
        leadTimeDays: 21,
      },
      {
        organizationId: org.id,
        supplierId: s1.id,
        name: 'BLE 5.0 Antenna Module',
        sku: 'SZ-BLE-50A',
        moq: 1000,
        unitPriceCents: 450,
        currency: 'USD',
        leadTimeDays: 28,
      },
      {
        organizationId: org.id,
        supplierId: s1.id,
        name: 'Industrial PCB Assembly',
        sku: 'SZ-PCB-IND1',
        moq: 200,
        unitPriceCents: 3200,
        currency: 'USD',
        leadTimeDays: 35,
      },
      // Guangzhou Textiles
      {
        organizationId: org.id,
        supplierId: s2.id,
        name: 'Organic Cotton T-Shirt',
        sku: 'GZ-TEX-OC001',
        moq: 500,
        unitPriceCents: 320,
        currency: 'USD',
        leadTimeDays: 45,
      },
      {
        organizationId: org.id,
        supplierId: s2.id,
        name: 'Recycled Polyester Jacket',
        sku: 'GZ-TEX-RPJ01',
        moq: 300,
        unitPriceCents: 1850,
        currency: 'USD',
        leadTimeDays: 60,
      },
      // Yiwu
      {
        organizationId: org.id,
        supplierId: s3.id,
        name: 'Stainless Steel Tumbler',
        sku: 'YW-SS-TUM01',
        moq: 200,
        unitPriceCents: 680,
        currency: 'USD',
        leadTimeDays: 25,
      },
      {
        organizationId: org.id,
        supplierId: s3.id,
        name: 'Silicone Phone Stand',
        sku: 'YW-SIL-PS01',
        moq: 500,
        unitPriceCents: 185,
        currency: 'USD',
        leadTimeDays: 18,
      },
      // Dongguan Precision
      {
        organizationId: org.id,
        supplierId: s4.id,
        name: 'Aluminum Enclosure 120x80',
        sku: 'DG-ALU-E120',
        moq: 100,
        unitPriceCents: 4800,
        currency: 'USD',
        leadTimeDays: 30,
      },
      {
        organizationId: org.id,
        supplierId: s4.id,
        name: 'CNC Titanium Bracket',
        sku: 'DG-CNC-TI01',
        moq: 50,
        unitPriceCents: 8200,
        currency: 'USD',
        leadTimeDays: 42,
      },
    ],
  });

  // ── Supplier Attachments ──────────────────────────────────────────────────
  await prisma.supplierAttachment.createMany({
    data: [
      {
        organizationId: org.id,
        supplierId: s1.id,
        uploadedById: alice.id,
        type: 'CATALOG',
        filename: 'sz-tech-catalog-2024.pdf',
        url: 'https://storage.example.com/sz-tech-catalog-2024.pdf',
        sizeBytes: 4_250_000,
      },
      {
        organizationId: org.id,
        supplierId: s1.id,
        uploadedById: alice.id,
        type: 'CERTIFICATE',
        filename: 'iso9001-sz-tech.pdf',
        url: 'https://storage.example.com/iso9001-sz-tech.pdf',
        sizeBytes: 320_000,
      },
      {
        organizationId: org.id,
        supplierId: s2.id,
        uploadedById: bob.id,
        type: 'CERTIFICATE',
        filename: 'oeko-tex-gz-textiles.pdf',
        url: 'https://storage.example.com/oeko-tex-gz-textiles.pdf',
        sizeBytes: 280_000,
      },
      {
        organizationId: org.id,
        supplierId: s4.id,
        uploadedById: alice.id,
        type: 'CATALOG',
        filename: 'dg-precision-products-2024.pdf',
        url: 'https://storage.example.com/dg-precision-products-2024.pdf',
        sizeBytes: 6_100_000,
      },
      {
        organizationId: org.id,
        supplierId: s5.id,
        uploadedById: bob.id,
        type: 'OTHER',
        filename: 'qc-audit-fail-report-2024.pdf',
        url: 'https://storage.example.com/qc-audit-fail-2024.pdf',
        sizeBytes: 1_100_000,
      },
    ],
  });

  // ── Supplier Interactions ─────────────────────────────────────────────────
  await prisma.supplierInteraction.createMany({
    data: [
      {
        organizationId: org.id,
        supplierId: s1.id,
        createdById: alice.id,
        type: 'MEETING',
        summary: 'Annual review — agreed on 2025 volume commitments and new PCB line capacity.',
        occurredAt: new Date('2024-11-15'),
      },
      {
        organizationId: org.id,
        supplierId: s1.id,
        createdById: bob.id,
        type: 'QC',
        summary: 'On-site QC inspection — passed with minor cosmetic defects on 3% of batch.',
        occurredAt: new Date('2024-10-08'),
      },
      {
        organizationId: org.id,
        supplierId: s2.id,
        createdById: alice.id,
        type: 'EMAIL',
        summary: 'Requested new samples for SS25 collection. ETA 3 weeks.',
        occurredAt: new Date('2024-12-02'),
      },
      {
        organizationId: org.id,
        supplierId: s2.id,
        createdById: bob.id,
        type: 'SAMPLE',
        summary: 'SS25 fabric samples received — cotton weight and color match approved.',
        occurredAt: new Date('2024-12-20'),
      },
      {
        organizationId: org.id,
        supplierId: s3.id,
        createdById: bob.id,
        type: 'CALL',
        summary: 'Negotiated 8% volume discount for Q1 order above 2000 units.',
        occurredAt: new Date('2024-12-10'),
      },
      {
        organizationId: org.id,
        supplierId: s4.id,
        createdById: alice.id,
        type: 'MEETING',
        summary:
          'Factory visit — impressive new 5-axis CNC line. Discussed titanium bracket project.',
        occurredAt: new Date('2024-09-25'),
      },
      {
        organizationId: org.id,
        supplierId: s5.id,
        createdById: alice.id,
        type: 'QC',
        summary: 'CRITICAL: QC audit failed. Found 23% defect rate and undeclared subcontractors.',
        occurredAt: new Date('2024-08-14'),
      },
    ],
  });

  // ── Intelligence Report ───────────────────────────────────────────────────
  await prisma.intelligenceReport.create({
    data: {
      organizationId: org.id,
      supplierId: s3.id,
      createdById: alice.id,
      sourceType: 'URL',
      sourceRef: 'https://yiwuglobal.en.alibaba.com',
      riskScore: 4.1,
      credibilityScore: 7.2,
      qualitySignal: 6.8,
      summary:
        'Yiwu Global Trading shows moderate risk profile. Established 2015, 85 employees, positive Alibaba transaction history. Main concerns: limited certifications, recent negative reviews on lead times. Opportunities: competitive pricing, wide SKU range ideal for mixed container orders.',
      redFlags: [
        { code: 'CERT_LIMITED', message: 'Only ISO 9001 — no product-specific certifications.' },
        { code: 'LEAD_TIME_RISK', message: '3 reviews mention late deliveries in Q4 2024.' },
        { code: 'SMALL_WORKFORCE', message: 'Only 85 employees — capacity risk for large orders.' },
      ],
      opportunities: [
        {
          code: 'PRICE_COMPETITIVE',
          message: 'Pricing 12–18% below market average for general merchandise.',
        },
        { code: 'LOW_MOQ', message: 'Accepts mixed-SKU orders from 50 units — ideal for testing.' },
        {
          code: 'FAST_SAMPLING',
          message: 'Sample turnaround 5–7 days, faster than industry average.',
        },
      ],
      rawAnalysis: {
        alibaba_score: 4.2,
        transaction_volume: '320+ confirmed orders',
        response_rate: '97%',
        review_count: 87,
        negative_reviews: 5,
        years_active: 9,
      },
      model: 'claude-sonnet-4-6',
      tokensUsed: 3842,
    },
  });
  console.log('  ✓ intelligence report');

  // ── Clients ───────────────────────────────────────────────────────────────
  const client1 = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: 'BFM Electronics SAS',
      email: 'purchase@bfm-electronics.example.com',
      taxId: 'FR 44 123 456 789',
      addressLine1: '42 Rue de la Paix',
      city: 'Paris',
      postalCode: '75002',
      country: 'FR',
      notes: 'Key account. Net-30 payment terms.',
    },
  });

  const client2 = await prisma.client.create({
    data: {
      organizationId: org.id,
      name: 'Global Traders International SA',
      email: 'ops@global-traders.example.com',
      taxId: 'CHE-123.456.789',
      addressLine1: '18 Quai du Mont-Blanc',
      city: 'Geneva',
      postalCode: '1201',
      country: 'CH',
      notes: 'Swiss-based distributor. Requires customs documentation. Net-45 terms.',
    },
  });
  console.log(`  ✓ clients: ${client1.name}, ${client2.name}`);

  // ── Orders ────────────────────────────────────────────────────────────────
  const order1 = await prisma.order.create({
    data: {
      organizationId: org.id,
      supplierId: s1.id,
      orderNumber: 'PO-2024-001',
      status: 'DELIVERED',
      totalCents: 1_250_000,
      currency: 'USD',
      marginCents: 312_500,
      expectedDeliveryAt: new Date('2024-10-15'),
      deliveredAt: new Date('2024-10-18'),
      notes: 'Q4 electronics order — USB-C modules + BLE antennas.',
      createdAt: new Date('2024-08-01'),
    },
  });

  const order2 = await prisma.order.create({
    data: {
      organizationId: org.id,
      supplierId: s4.id,
      orderNumber: 'PO-2024-002',
      status: 'IN_PRODUCTION',
      totalCents: 480_000,
      currency: 'USD',
      expectedDeliveryAt: new Date('2025-02-28'),
      notes: 'CNC aluminum enclosures for Q1 product launch.',
      createdAt: new Date('2024-12-10'),
    },
  });

  const order3 = await prisma.order.create({
    data: {
      organizationId: org.id,
      supplierId: s2.id,
      orderNumber: 'PO-2025-001',
      status: 'QUOTED',
      totalCents: 185_000,
      currency: 'USD',
      expectedDeliveryAt: new Date('2025-04-30'),
      notes: 'SS25 apparel collection — pending final size breakdowns.',
      createdAt: new Date('2025-01-08'),
    },
  });
  console.log(`  ✓ orders: ${[order1, order2, order3].map((o) => o.orderNumber).join(', ')}`);

  // ── Order Items ───────────────────────────────────────────────────────────
  await prisma.orderItem.createMany({
    data: [
      {
        organizationId: org.id,
        orderId: order1.id,
        productName: 'USB-C Power Module 65W',
        sku: 'SZ-PWR-65W',
        quantity: 500,
        unitPriceCents: 1250,
        totalCents: 625_000,
      },
      {
        organizationId: org.id,
        orderId: order1.id,
        productName: 'BLE 5.0 Antenna Module',
        sku: 'SZ-BLE-50A',
        quantity: 1000,
        unitPriceCents: 450,
        totalCents: 450_000,
      },
      {
        organizationId: org.id,
        orderId: order1.id,
        productName: 'Industrial PCB Assembly',
        sku: 'SZ-PCB-IND1',
        quantity: 55,
        unitPriceCents: 3200,
        totalCents: 176_000,
      },
      {
        organizationId: org.id,
        orderId: order2.id,
        productName: 'Aluminum Enclosure 120x80',
        sku: 'DG-ALU-E120',
        quantity: 100,
        unitPriceCents: 4800,
        totalCents: 480_000,
      },
      {
        organizationId: org.id,
        orderId: order3.id,
        productName: 'Organic Cotton T-Shirt',
        sku: 'GZ-TEX-OC001',
        quantity: 300,
        unitPriceCents: 320,
        totalCents: 96_000,
      },
      {
        organizationId: org.id,
        orderId: order3.id,
        productName: 'Recycled Polyester Jacket',
        sku: 'GZ-TEX-RPJ01',
        quantity: 100,
        unitPriceCents: 1850,
        totalCents: 185_000,
      },
    ],
  });

  // ── Shipment ──────────────────────────────────────────────────────────────
  await prisma.shipment.create({
    data: {
      organizationId: org.id,
      orderId: order1.id,
      carrier: 'COSCO Shipping',
      trackingNumber: 'COSC2024100123456',
      mode: 'SEA',
      etd: new Date('2024-09-20'),
      eta: new Date('2024-10-14'),
      deliveredAt: new Date('2024-10-18'),
      status: 'DELIVERED',
      lastEventAt: new Date('2024-10-18'),
      lastEventDescription: 'Delivered to warehouse — all parcels accounted for.',
    },
  });

  await prisma.shipment.create({
    data: {
      organizationId: org.id,
      orderId: order2.id,
      carrier: 'DHL Express',
      mode: 'AIR',
      etd: new Date('2025-02-20'),
      eta: new Date('2025-02-26'),
      status: 'AWAITING_DISPATCH',
    },
  });

  // ── Quality Check ─────────────────────────────────────────────────────────
  await prisma.qualityCheck.create({
    data: {
      organizationId: org.id,
      orderId: order1.id,
      performedAt: new Date('2024-09-15'),
      inspector: 'Bob Chen',
      passed: true,
      defectsFound: 8,
      notes: 'Minor cosmetic defects on 8/1555 units (0.5%). Accepted per tolerance agreement.',
    },
  });

  // ── Invoices ──────────────────────────────────────────────────────────────
  const invoice1 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      orderId: order1.id,
      clientId: client1.id,
      invoiceNumber: 'INV-2024-001',
      type: 'COMMERCIAL',
      status: 'PAID',
      issueDate: new Date('2024-10-20'),
      dueDate: new Date('2024-11-19'),
      currency: 'USD',
      subtotalCents: 1_562_500,
      taxCents: 0,
      totalCents: 1_562_500,
      paidCents: 1_562_500,
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      organizationId: org.id,
      orderId: order3.id,
      clientId: client2.id,
      invoiceNumber: 'INV-2025-001',
      type: 'PROFORMA',
      status: 'SENT',
      issueDate: new Date('2025-01-10'),
      dueDate: new Date('2025-02-09'),
      currency: 'USD',
      subtotalCents: 231_250,
      taxCents: 0,
      totalCents: 231_250,
      paidCents: 0,
    },
  });
  console.log(`  ✓ invoices: ${invoice1.invoiceNumber}, ${invoice2.invoiceNumber}`);

  // ── Invoice Items ─────────────────────────────────────────────────────────
  await prisma.invoiceItem.createMany({
    data: [
      {
        organizationId: org.id,
        invoiceId: invoice1.id,
        description: 'USB-C Power Module 65W × 500',
        quantity: 500,
        unitPriceCents: 1563,
        totalCents: 781_500,
      },
      {
        organizationId: org.id,
        invoiceId: invoice1.id,
        description: 'BLE 5.0 Antenna Module × 1000',
        quantity: 1000,
        unitPriceCents: 563,
        totalCents: 563_000,
      },
      {
        organizationId: org.id,
        invoiceId: invoice1.id,
        description: 'Industrial PCB Assembly × 55',
        quantity: 55,
        unitPriceCents: 4000,
        totalCents: 220_000,
      },
      {
        organizationId: org.id,
        invoiceId: invoice2.id,
        description: 'Organic Cotton T-Shirt × 300',
        quantity: 300,
        unitPriceCents: 400,
        totalCents: 120_000,
      },
      {
        organizationId: org.id,
        invoiceId: invoice2.id,
        description: 'Recycled Polyester Jacket × 100',
        quantity: 100,
        unitPriceCents: 1113,
        totalCents: 111_300,
      },
    ],
  });

  // ── Payment ───────────────────────────────────────────────────────────────
  await prisma.payment.create({
    data: {
      organizationId: org.id,
      invoiceId: invoice1.id,
      amountCents: 1_562_500,
      currency: 'USD',
      method: 'WIRE_TRANSFER',
      paidAt: new Date('2024-11-05'),
      reference: 'WIRE-BFM-20241105-001',
    },
  });

  // ── Activity Logs ─────────────────────────────────────────────────────────
  await prisma.activityLog.createMany({
    data: [
      {
        organizationId: org.id,
        userId: alice.id,
        action: 'supplier.created',
        entityType: 'Supplier',
        entityId: s1.id,
        metadata: { name: s1.name },
      },
      {
        organizationId: org.id,
        userId: alice.id,
        action: 'order.created',
        entityType: 'Order',
        entityId: order1.id,
        metadata: { orderNumber: 'PO-2024-001' },
      },
      {
        organizationId: org.id,
        userId: alice.id,
        action: 'invoice.paid',
        entityType: 'Invoice',
        entityId: invoice1.id,
        metadata: { amount: 1_562_500, currency: 'USD' },
      },
      {
        organizationId: org.id,
        userId: bob.id,
        action: 'supplier.archived',
        entityType: 'Supplier',
        entityId: s5.id,
        metadata: { reason: 'Failed QC audit' },
      },
    ],
  });

  console.log('');
  console.log('✅ Seed complete.');
  console.log(`   Org:       ${org.name} (${org.slug})`);
  console.log(`   Users:     Alice Martin (OWNER), Bob Chen (MEMBER)`);
  console.log(`   Suppliers: 5 (4 active, 1 archived)`);
  console.log(`   Orders:    3 (1 delivered, 1 in production, 1 quoted)`);
  console.log(`   Invoices:  2 (1 paid, 1 sent)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
