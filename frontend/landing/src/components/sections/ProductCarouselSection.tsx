import React, { useRef, useState, useEffect } from 'react';
import { ProductCarouselConfig, ProductCard } from '@/types/contract';
import { mockProducts } from '@/mocks/homepageData';
import { formatPrice, getLayoutClasses } from '@/utils/format';
import { ChevronLeft, ChevronRight, X, Eye, Check } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface ProductCarouselSectionProps {
  config: ProductCarouselConfig;
  products?: ProductCard[];
}

export const ProductCarouselSection: React.FC<ProductCarouselSectionProps> = ({
  config,
  products = mockProducts,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(null);
  const [activeFinish, setActiveFinish] = useState<string>('');
  const layout = getLayoutClasses(config.layout);
  const { ref: sectionRef, isVisible } = useScrollReveal<HTMLElement>();

  // Accessible Escape listener for modal
  useEffect(() => {
    if (!selectedProduct) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedProduct(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const displayedProducts = products.slice(0, config.count || 6);

  const openProductModal = (product: ProductCard) => {
    setSelectedProduct(product);
    setActiveFinish(product.finishNames[0] || 'Mirror Chrome');
  };

  return (
    <section id="catalogue" ref={sectionRef} className={`${layout.section} scroll-mt-24 relative`}>
      {/* Anchor alias so both #catalogue and #products land identically */}
      <div id="products" className="absolute top-0 pointer-events-none scroll-mt-24" aria-hidden="true" />
      <div className={layout.container}>
        {/* Section Header */}
        <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 sm:mb-12 reveal-base ${isVisible ? 'reveal-visible' : ''}`}>
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-purple-deep">
              Curated Selection
            </span>
            <h2 className="text-2xl sm:text-4xl font-display font-bold text-ink tracking-tight mt-1">
              {config.heading}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {config.viewAllHref && (
              <Button
                asLink
                href={config.viewAllHref}
                variant="secondary"
                size="sm"
                className="mr-2"
              >
                All Fixtures
              </Button>
            )}
            <Button
              variant="circle"
              size="md"
              onClick={() => scroll('left')}
              aria-label="Scroll carousel backward"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="circle"
              size="md"
              onClick={() => scroll('right')}
              aria-label="Scroll carousel forward"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Cards Track */}
        <div
          ref={scrollRef}
          className="flex space-x-6 overflow-x-auto pb-8 pt-4 scrollbar-none snap-x snap-mandatory px-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayedProducts.map((product, idx) => (
            <InteractiveProductCard
              key={product.id}
              product={product}
              idx={idx}
              isVisible={isVisible}
              onOpenModal={openProductModal}
            />
          ))}
        </div>
      </div>

      {/* Product Quick View Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 bg-ink/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-surface-white rounded-token-lg overflow-hidden shadow-elevated border border-border-subtle p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="circle"
              size="sm"
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4"
              aria-label="Close product view"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-square rounded-token-md overflow-hidden bg-purple-pale/20 border border-border-subtle">
                <img
                  src={selectedProduct.coverImageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-ink-subtle mb-1">
                    <span>{selectedProduct.categoryName}</span>
                    <span className="font-mono">{selectedProduct.sku}</span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-ink">
                    {selectedProduct.name}
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">{selectedProduct.specSummary}</p>
                </div>

                <div>
                  <span className="text-xs font-semibold text-ink block mb-1.5">Select Finish:</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.finishNames.map((finish) => (
                      <button
                        key={finish}
                        type="button"
                        onClick={() => setActiveFinish(finish)}
                        className={`text-xs px-2.5 py-1 rounded-token-sm border btn-tactile inline-flex items-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                          activeFinish === finish
                            ? 'bg-ink text-white border-ink shadow-subtle'
                            : 'bg-neutral-50 text-ink border-border-subtle hover:border-ink hover:bg-white'
                        }`}
                      >
                        {activeFinish === finish && <Check className="w-3 h-3 text-white" />}
                        <span>{finish}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-[10px] uppercase font-semibold text-ink-subtle block">
                    Sample Estimate
                  </span>
                  <p className="text-xl font-display font-bold text-ink">
                    {formatPrice(selectedProduct.basePricePaise)}
                  </p>
                  <p className="text-[10px] text-ink-subtle mt-0.5">
                    *Sample figure for layout demonstration. Actual price confirmed per project schedule.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    asLink
                    href="#contact"
                    onClick={() => setSelectedProduct(null)}
                    variant="primary"
                    size="md"
                    className="w-full justify-between"
                  >
                    Request Project Quotation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

interface InteractiveProductCardProps {
  product: ProductCard;
  idx: number;
  isVisible: boolean;
  onOpenModal: (product: ProductCard) => void;
}

const InteractiveProductCard: React.FC<InteractiveProductCardProps> = ({
  product,
  idx,
  isVisible,
  onOpenModal,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [activeFinish, setActiveFinish] = useState<string>(product.finishNames[0] || 'Mirror Chrome');
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5; // max 5 deg tilt
    const rotateY = ((x - centerX) / centerX) * 5;

    setTiltStyle({
      transform: `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translate3d(0, -6px, 0)`,
      transition: 'transform 80ms ease-out',
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTiltStyle({
      transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)',
      transition: 'transform 400ms ease-out',
    });
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => onOpenModal(product)}
      className={`group relative flex-none w-[290px] sm:w-[330px] snap-start rounded-token-lg p-5 cursor-pointer flex flex-col justify-between transition-all duration-300 reveal-base ${
        isVisible ? 'reveal-visible' : ''
      } ${
        isHovered
          ? 'bg-gradient-to-b from-white via-[#FAF7FD] to-white border-purple-light/50 shadow-[0_20px_40px_-12px_rgba(91,42,134,0.18)]'
          : 'bg-surface-white border border-border-subtle shadow-subtle'
      }`}
      style={{
        ...tiltStyle,
        transitionDelay: `${Math.min(idx * 70, 350)}ms`,
      }}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpenModal(product);
        }
      }}
      aria-label={`View ${product.name} specifications`}
    >
      {/* Subtle Purple Aura on Hover */}
      <div
        className={`absolute -inset-[1px] rounded-token-lg bg-gradient-to-br from-purple-light/30 via-transparent to-purple-pale/20 pointer-events-none transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      <div className="relative z-10">
        {/* Product Cover Image with Depth */}
        <div className="relative w-full aspect-square bg-[#F8F6FA] rounded-token-md overflow-hidden mb-4 border border-border-subtle/60 group-hover:border-purple-light/40 transition-colors">
          <img
            src={product.coverImageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-[1.05] transition-transform duration-700 ease-out"
          />

          {/* Architectural Badge */}
          {product.badge && (
            <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-purple-deep text-[11px] font-semibold px-2.5 py-0.5 rounded-full shadow-subtle border border-purple-light/20">
              {product.badge}
            </span>
          )}

          {/* Quick View Hover Pill */}
          <div className="absolute inset-0 bg-ink/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-ink text-xs font-semibold px-3 py-1.5 rounded-full shadow-floating flex items-center gap-1.5 border border-border-subtle/80">
              <Eye className="w-3.5 h-3.5 text-purple-deep" />
              <span>Inspect Fixture</span>
            </span>
          </div>
        </div>

        {/* Metadata & Title */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between text-xs text-ink-subtle">
            <span className="font-medium tracking-wide">{product.categoryName}</span>
            <span className="font-mono text-[10px] text-purple-deep font-semibold">{product.sku}</span>
          </div>
          <h3 className="font-display font-bold text-base text-ink line-clamp-1 group-hover:text-purple-deep transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Spec Summary */}
        {product.specSummary && (
          <p className="text-xs text-ink-muted line-clamp-1 mb-3">
            {product.specSummary}
          </p>
        )}

        {/* Live Finish Swatches */}
        <div className="flex items-center gap-1.5 mb-4 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] uppercase font-mono tracking-wider text-ink-subtle mr-1">
            Finishes:
          </span>
          {product.finishNames.map((finish) => (
            <button
              key={finish}
              type="button"
              onClick={() => setActiveFinish(finish)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                activeFinish === finish
                  ? 'bg-purple-deep text-white border-purple-deep shadow-subtle'
                  : 'bg-white text-ink-muted border-border-subtle hover:border-purple-deep/40'
              }`}
              aria-label={`Select finish ${finish}`}
            >
              {finish}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Price & Action (Architectural Capsule Design) */}
      <div className="relative z-10 pt-3 border-t border-border-subtle/80 flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase font-mono tracking-wider text-ink-subtle block">
            Estimate ({activeFinish})
          </span>
          <span className="text-base font-display font-bold text-purple-deep">
            {formatPrice(product.basePricePaise)}
          </span>
        </div>

        <Button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal(product);
          }}
          variant="secondary"
          size="sm"
          className="text-xs"
        >
          Details
        </Button>
      </div>
    </article>
  );
};

