"use strict";
/**
 * DIE Analytics — Cost Intelligence Service
 * Block 5B: Intelligence & Analytics Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostIntelligenceService = void 0;
const prisma_1 = require("../../prisma");
const analytics_utils_1 = require("./analytics-utils");
class CostIntelligenceService {
    /**
     * Get cost metrics for a specific product
     */
    static async getCostMetrics(productId, productType, businessId, dateRange = (0, analytics_utils_1.getDateRange)('year')) {
        const p = prisma_1.prisma;
        // Fetch product
        let product = null;
        if (productType === 'INVENTORY_ITEM') {
            product = await p.inventoryItem.findUnique({
                where: { id: productId },
                select: { id: true, name: true, businessId: true },
            });
            if (!product || product.businessId !== businessId)
                return null;
        }
        else {
            product = await p.supplierProduct.findUnique({
                where: { id: productId },
                select: { id: true, name: true },
            });
            if (!product)
                return null;
        }
        // Fetch all line items
        const whereClause = {
            scannedDocument: {
                businessId,
                createdAt: { gte: dateRange.from, lte: dateRange.to },
            },
        };
        if (productType === 'INVENTORY_ITEM') {
            whereClause.productId = productId;
        }
        else {
            whereClause.supplierProductId = productId;
        }
        const items = await p.scannedDocumentItem.findMany({
            where: whereClause,
            select: {
                unitPriceCents: true,
                quantity: true,
                scannedDocument: {
                    select: {
                        createdAt: true,
                        supplierId: true,
                        supplier: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { scannedDocument: { createdAt: 'asc' } },
        });
        if (items.length === 0)
            return null;
        const prices = items
            .map((item) => item.unitPriceCents)
            .filter((p) => p !== null && p > 0);
        if (prices.length === 0)
            return null;
        const currentPrice = prices[prices.length - 1];
        const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        const weightedAveragePrice = (0, analytics_utils_1.calculateWeightedAverage)(items
            .filter((item) => item.unitPriceCents && item.quantity)
            .map((item) => ({
            value: item.unitPriceCents,
            weight: item.quantity,
        })));
        const lowestPrice = Math.min(...prices);
        const highestPrice = Math.max(...prices);
        const priceVolatility = (0, analytics_utils_1.calculateVolatility)(prices);
        // Calculate monthly inflation (last 30 days vs previous 30 days)
        const now = new Date();
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const prev30 = new Date(last30.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last30Prices = items
            .filter((item) => item.scannedDocument.createdAt >= last30)
            .map((item) => item.unitPriceCents)
            .filter((p) => p !== null && p > 0);
        const prev30Prices = items
            .filter((item) => item.scannedDocument.createdAt >= prev30 && item.scannedDocument.createdAt < last30)
            .map((item) => item.unitPriceCents)
            .filter((p) => p !== null && p > 0);
        const avgLast30 = last30Prices.length > 0
            ? last30Prices.reduce((sum, p) => sum + p, 0) / last30Prices.length
            : 0;
        const avgPrev30 = prev30Prices.length > 0
            ? prev30Prices.reduce((sum, p) => sum + p, 0) / prev30Prices.length
            : 0;
        const monthlyInflation = avgPrev30 > 0 ? ((avgLast30 - avgPrev30) / avgPrev30) * 100 : 0;
        // Price history time series
        const priceHistory = (0, analytics_utils_1.aggregateToTimeSeries)(items.filter((item) => item.unitPriceCents), (item) => item.scannedDocument.createdAt, (item) => item.unitPriceCents || 0, dateRange.from, dateRange.to, 'month').map((point) => ({
            ...point,
            value: point.value > 0 ? Math.round(point.value) : 0,
        }));
        // Supplier prices
        const supplierPriceMap = new Map();
        for (const item of items) {
            if (!item.unitPriceCents || !item.scannedDocument.supplier)
                continue;
            const supplierId = item.scannedDocument.supplierId;
            const existing = supplierPriceMap.get(supplierId) || {
                name: item.scannedDocument.supplier.name,
                prices: [],
                lastDate: item.scannedDocument.createdAt,
            };
            existing.prices.push(item.unitPriceCents);
            if (item.scannedDocument.createdAt > existing.lastDate) {
                existing.lastDate = item.scannedDocument.createdAt;
            }
            supplierPriceMap.set(supplierId, existing);
        }
        const supplierPrices = Array.from(supplierPriceMap.entries())
            .map(([id, data]) => ({
            supplierId: id,
            supplierName: data.name,
            price: Math.round(data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length),
            lastPurchaseDate: data.lastDate,
        }))
            .sort((a, b) => a.price - b.price);
        return {
            productId,
            productName: product.name,
            currentPrice,
            averagePrice: Math.round(averagePrice),
            weightedAveragePrice: Math.round(weightedAveragePrice),
            lowestPrice,
            highestPrice,
            priceVolatility: Math.round(priceVolatility * 10) / 10,
            monthlyInflation: Math.round(monthlyInflation * 10) / 10,
            priceHistory,
            supplierPrices,
        };
    }
    /**
     * Get comprehensive cost intelligence report
     */
    static async getCostIntelligence(options) {
        const { businessId, dateRange = (0, analytics_utils_1.getDateRange)('year'), limit = 10 } = options;
        const p = prisma_1.prisma;
        // Get all documents in range
        const documents = await p.scannedDocument.findMany({
            where: {
                businessId,
                createdAt: { gte: dateRange.from, lte: dateRange.to },
            },
            select: {
                createdAt: true,
                totalCents: true,
                items: {
                    select: {
                        productId: true,
                        supplierProductId: true,
                        unitPriceCents: true,
                        quantity: true,
                    },
                },
            },
        });
        // Cost trends over time
        const costTrends = (0, analytics_utils_1.aggregateToTimeSeries)(documents, (d) => d.createdAt, (d) => d.totalCents || 0, dateRange.from, dateRange.to, 'month');
        // Detect price spikes (>20% increase from previous purchase)
        const allItems = documents.flatMap((d) => d.items.map((item) => ({
            ...item,
            createdAt: d.createdAt,
        })));
        const productPriceHistory = new Map();
        for (const item of allItems) {
            const key = item.productId || item.supplierProductId;
            if (!key || !item.unitPriceCents)
                continue;
            const history = productPriceHistory.get(key) || [];
            history.push({ price: item.unitPriceCents, date: item.createdAt });
            productPriceHistory.set(key, history);
        }
        const priceSpikes = [];
        for (const [productId, history] of productPriceHistory.entries()) {
            const sorted = history.sort((a, b) => a.date.getTime() - b.date.getTime());
            for (let i = 1; i < sorted.length; i++) {
                const prev = sorted[i - 1];
                const curr = sorted[i];
                const increase = ((curr.price - prev.price) / prev.price) * 100;
                if (increase > 20) {
                    // Fetch product name
                    const item = allItems.find((it) => (it.productId || it.supplierProductId) === productId);
                    if (!item)
                        continue;
                    let productName = 'Unknown';
                    if (item.productId) {
                        const prod = await p.inventoryItem.findUnique({
                            where: { id: item.productId },
                            select: { name: true },
                        });
                        productName = prod?.name || 'Unknown';
                    }
                    else if (item.supplierProductId) {
                        const prod = await p.supplierProduct.findUnique({
                            where: { id: item.supplierProductId },
                            select: { name: true },
                        });
                        productName = prod?.name || 'Unknown';
                    }
                    priceSpikes.push({
                        productId,
                        productName,
                        oldPrice: prev.price,
                        newPrice: curr.price,
                        increase: Math.round(increase * 10) / 10,
                        date: curr.date,
                    });
                }
            }
        }
        const topPriceSpikes = priceSpikes
            .sort((a, b) => b.increase - a.increase)
            .slice(0, limit);
        // Savings opportunities (products with multiple suppliers at different prices)
        const savingsOpportunities = [];
        // This is expensive, so we'll limit it
        const uniqueProducts = new Set(allItems
            .map((item) => item.productId || item.supplierProductId)
            .filter((id) => id !== null));
        for (const productId of Array.from(uniqueProducts).slice(0, 20)) {
            const productItems = await p.scannedDocumentItem.findMany({
                where: {
                    OR: [{ productId }, { supplierProductId: productId }],
                    scannedDocument: { businessId },
                },
                include: {
                    scannedDocument: {
                        select: {
                            supplier: { select: { id: true, name: true } },
                            createdAt: true,
                        },
                    },
                },
            });
            const supplierPrices = new Map();
            for (const item of productItems) {
                if (!item.unitPriceCents || !item.scannedDocument.supplier)
                    continue;
                const supplierId = item.scannedDocument.supplier.id;
                const existing = supplierPrices.get(supplierId) || {
                    name: item.scannedDocument.supplier.name,
                    prices: [],
                    lastDate: item.scannedDocument.createdAt,
                };
                existing.prices.push(item.unitPriceCents);
                if (item.scannedDocument.createdAt > existing.lastDate) {
                    existing.lastDate = item.scannedDocument.createdAt;
                }
                supplierPrices.set(supplierId, existing);
            }
            if (supplierPrices.size < 2)
                continue;
            const avgPrices = Array.from(supplierPrices.entries()).map(([id, data]) => ({
                supplierId: id,
                supplierName: data.name,
                avgPrice: data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length,
                lastDate: data.lastDate,
            }));
            const sorted = avgPrices.sort((a, b) => a.avgPrice - b.avgPrice);
            const cheapest = sorted[0];
            const mostExpensive = sorted[sorted.length - 1];
            const savings = mostExpensive.avgPrice - cheapest.avgPrice;
            if (savings > cheapest.avgPrice * 0.1) {
                let productName = 'Unknown';
                const firstItem = productItems[0];
                if (firstItem.productId) {
                    const prod = await p.inventoryItem.findUnique({
                        where: { id: firstItem.productId },
                        select: { name: true },
                    });
                    productName = prod?.name || 'Unknown';
                }
                else if (firstItem.supplierProductId) {
                    const prod = await p.supplierProduct.findUnique({
                        where: { id: firstItem.supplierProductId },
                        select: { name: true },
                    });
                    productName = prod?.name || 'Unknown';
                }
                savingsOpportunities.push({
                    productId: productId,
                    productName,
                    currentSupplier: mostExpensive.supplierName,
                    currentPrice: Math.round(mostExpensive.avgPrice),
                    betterSupplier: cheapest.supplierName,
                    betterPrice: Math.round(cheapest.avgPrice),
                    potentialSavings: Math.round(savings),
                });
            }
        }
        // Supplier cost rankings
        const supplierSpend = new Map();
        for (const doc of documents) {
            const supplier = await p.scannedDocument.findUnique({
                where: { id: doc.id },
                select: { supplier: { select: { id: true, name: true } } },
            });
            if (!supplier?.supplier)
                continue;
            const existing = supplierSpend.get(supplier.supplier.id) || {
                name: supplier.supplier.name,
                total: 0,
                count: 0,
            };
            existing.total += doc.totalCents || 0;
            existing.count += 1;
            supplierSpend.set(supplier.supplier.id, existing);
        }
        const supplierCostRankings = Array.from(supplierSpend.entries())
            .map(([id, data]) => ({
            supplierId: id,
            supplierName: data.name,
            averageCost: Math.round(data.total / data.count),
            totalSpend: data.total,
            costEfficiencyScore: Math.round(100 - Math.min(((data.total / data.count) / 100000) * 10, 50)),
        }))
            .sort((a, b) => a.averageCost - b.averageCost)
            .slice(0, limit);
        const totalSpend = documents.reduce((sum, d) => sum + (d.totalCents || 0), 0);
        const averageCost = (0, analytics_utils_1.safeDivide)(totalSpend, documents.length);
        // Calculate inflation
        const now = new Date();
        const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const prev30 = new Date(last30.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const prev90 = new Date(last90.getTime() - 90 * 24 * 60 * 60 * 1000);
        const last30Docs = documents.filter((d) => d.createdAt >= last30);
        const prev30Docs = documents.filter((d) => d.createdAt >= prev30 && d.createdAt < last30);
        const last90Docs = documents.filter((d) => d.createdAt >= last90);
        const prev90Docs = documents.filter((d) => d.createdAt >= prev90 && d.createdAt < last90);
        const avgLast30 = (0, analytics_utils_1.safeDivide)(last30Docs.reduce((sum, d) => sum + (d.totalCents || 0), 0), last30Docs.length);
        const avgPrev30 = (0, analytics_utils_1.safeDivide)(prev30Docs.reduce((sum, d) => sum + (d.totalCents || 0), 0), prev30Docs.length);
        const avgLast90 = (0, analytics_utils_1.safeDivide)(last90Docs.reduce((sum, d) => sum + (d.totalCents || 0), 0), last90Docs.length);
        const avgPrev90 = (0, analytics_utils_1.safeDivide)(prev90Docs.reduce((sum, d) => sum + (d.totalCents || 0), 0), prev90Docs.length);
        const inflation30d = avgPrev30 > 0 ? ((avgLast30 - avgPrev30) / avgPrev30) * 100 : 0;
        const inflation90d = avgPrev90 > 0 ? ((avgLast90 - avgPrev90) / avgPrev90) * 100 : 0;
        const savingsPotential = savingsOpportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
        return {
            costTrends,
            priceSpikes: topPriceSpikes,
            savingsOpportunities: savingsOpportunities.slice(0, limit),
            supplierCostRankings,
            summary: {
                totalSpend,
                averageCost: Math.round(averageCost),
                inflation30d: Math.round(inflation30d * 10) / 10,
                inflation90d: Math.round(inflation90d * 10) / 10,
                savingsPotential,
            },
        };
    }
}
exports.CostIntelligenceService = CostIntelligenceService;
