import {
  OrderStatus as PrismaOrderStatus,
  PaymentStatus as PrismaPaymentStatus,
  SubmissionStatus as PrismaSubmissionStatus,
  SubmissionType as PrismaSubmissionType,
} from '../generated/prisma/client';
import type {
  AdminCategory,
  AdminCollection,
  AdminJournalArticle,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminSubmission,
  DashboardSummary,
  OrderStatusName,
  PaymentStatusName,
  SubmissionKind,
  SubmissionState,
} from '../../../shared/types/src/index';

/**
 * Guards the admin commerce and content shapes in shared/types against the
 * Prisma enums and the columns those responses are built from.
 */

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

type _orderStatus = Expect<Equal<OrderStatusName, PrismaOrderStatus>>;
type _paymentStatus = Expect<Equal<PaymentStatusName, PrismaPaymentStatus>>;
type _submissionKind = Expect<Equal<SubmissionKind, PrismaSubmissionType>>;
type _submissionState = Expect<Equal<SubmissionState, PrismaSubmissionStatus>>;

const CATEGORY = ['id', 'name', 'slug', 'description', 'parentId', 'position', 'status'] as const;
const ORDER_SUMMARY = ['id', 'reference', 'customerName', 'customerEmail', 'total', 'paymentStatus', 'status', 'createdAt'] as const;
const ORDER_DETAIL_EXTRA = ['customerPhone', 'delivery', 'subtotal', 'shipping', 'tax', 'items', 'timeline'] as const;
const COLLECTION = ['id', 'name', 'slug', 'description', 'story', 'heroMediaId', 'status', 'productIds'] as const;
const ARTICLE = ['id', 'title', 'slug', 'category', 'excerpt', 'body', 'heroImageId', 'status', 'publishedAt'] as const;
const SUBMISSION = ['id', 'type', 'reference', 'status', 'emailSent', 'emailError', 'createdAt', 'name', 'email', 'phone', 'city', 'firmName', 'message'] as const;
const DASHBOARD = ['draftPages', 'productsMissingImages', 'productsMissingSpecs', 'recentOrders', 'recentSubmissions'] as const;

type _categoryKeys = Expect<Equal<keyof AdminCategory, (typeof CATEGORY)[number]>>;
type _orderKeys = Expect<Equal<keyof AdminOrderSummary, (typeof ORDER_SUMMARY)[number]>>;
type _orderDetailKeys = Expect<Equal<keyof AdminOrderDetail, (typeof ORDER_SUMMARY)[number] | (typeof ORDER_DETAIL_EXTRA)[number]>>;
type _collectionKeys = Expect<Equal<keyof AdminCollection, (typeof COLLECTION)[number]>>;
type _articleKeys = Expect<Equal<keyof AdminJournalArticle, (typeof ARTICLE)[number]>>;
type _submissionKeys = Expect<Equal<keyof AdminSubmission, (typeof SUBMISSION)[number]>>;
type _dashboardKeys = Expect<Equal<keyof DashboardSummary, (typeof DASHBOARD)[number]>>;

const typeChecks: [_orderStatus, _paymentStatus, _submissionKind, _submissionState, _categoryKeys, _orderKeys, _orderDetailKeys, _collectionKeys, _articleKeys, _submissionKeys, _dashboardKeys] = [true, true, true, true, true, true, true, true, true, true, true];

describe('shared/types admin commerce drift', () => {
  it('typechecks order, payment and submission enums against Prisma', () => {
    expect(typeChecks.every(Boolean)).toBe(true);
    expect(Object.values(PrismaOrderStatus).sort()).toEqual(['cancelled', 'confirmed', 'received', 'shipped']);
    expect(Object.values(PrismaPaymentStatus).sort()).toEqual(['failed', 'paid', 'pending', 'refunded']);
    expect(Object.values(PrismaSubmissionType).sort()).toEqual(['contact', 'dealer']);
    expect(Object.values(PrismaSubmissionStatus).sort()).toEqual(['handled', 'new', 'read']);
  });

  it('keeps the admin response key lists', () => {
    expect(CATEGORY).toContain('slug');
    expect(ORDER_SUMMARY).toContain('reference');
    expect(ORDER_DETAIL_EXTRA).toContain('timeline');
    expect(COLLECTION).toContain('heroMediaId');
    expect(ARTICLE).toContain('heroImageId');
    expect(SUBMISSION).toContain('emailSent');
    expect(DASHBOARD).toContain('draftPages');
  });
});
