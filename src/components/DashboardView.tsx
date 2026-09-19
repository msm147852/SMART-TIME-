            {isAr ? 'لا توجد بطاقات معروضة' : 'No cards displayed'}
          </p>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'تأكد من عدم إخفاء جميع البطاقات أو إلغاء فلتر المفضلة.'
              : 'Make sure cards are not hidden or disable the favorites filter.'}
          </p>
        </div>
      ) : layoutMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 w-full">
          {visibleSections.map((section, index) => {
            const isHidden = hiddenIds.includes(section.id);
            const isWide = cardSizes[section.id] === 'wide';
            return (
              <Interactive3DCard
                key={section.id}
                section={section}
                index={index}
                totalCards={visibleSections.length}
                isAr={isAr}
                statBadge={getStatBadge(section.id)}
                isReorderMode={isReorderMode}
                isHidden={isHidden}
                isWide={isWide}
                onClick={() => handleCardClick(section.id)}
                onToggleFavorite={(e) => toggleFavorite(section.id, e)}
                onToggleVisibility={(e) => {
                  e?.stopPropagation();
                  toggleCardVisibility(section.id);
                }}
                onToggleSize={(e) => {