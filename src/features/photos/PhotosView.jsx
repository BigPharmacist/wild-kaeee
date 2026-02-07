const PhotosView = ({
  theme,
  Icons, // eslint-disable-line no-unused-vars -- used as Icons.X
  secondaryTab,
  photosLoading,
  allPhotos,
  deletePhoto,
  openPhotoEditor,
  ocrProcessing,
  photoOcrData,
  runOcrForPhoto,
  businessCardsLoading,
  businessCards,
  deleteBusinessCard,
}) => (
  <>
    <h2 className="text-2xl lg:text-3xl font-semibold mb-6 tracking-tight">
      {secondaryTab === 'visitenkarten' ? 'Visitenkarten' : 'Fotos'}
    </h2>

    {secondaryTab === 'ocr' && (
      <>
        {photosLoading ? (
          <p className={theme.textMuted}>Fotos werden geladen...</p>
        ) : allPhotos.length === 0 ? (
          <p className={theme.textMuted}>Keine Fotos vorhanden. Nutze das Kamera-Symbol oben.</p>
        ) : (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {allPhotos.map((photo) => (
              <div
                key={photo.name}
                className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden hover:ring-2 hover:ring-[#F59E0B] transition-all relative group`}
              >
                <button
                  type="button"
                  onClick={(e) => deletePhoto(photo.name, e)}
                  className={`absolute top-2 right-2 p-1.5 rounded-lg ${theme.panel} border ${theme.border} opacity-0 group-hover:opacity-100 transition-opacity ${theme.danger} z-10`}
                  title="Foto löschen"
                >
                  <Icons.X />
                </button>
                <button
                  type="button"
                  onClick={() => openPhotoEditor(photo)}
                  className="w-full text-left"
                >
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="p-2 space-y-1">
                    <p className={`text-xs ${theme.textMuted} truncate`}>
                      {photo.createdAt
                        ? new Date(photo.createdAt).toLocaleDateString('de-DE')
                        : photo.name}
                    </p>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {photo.format}{photo.sizeKB ? ` · ${photo.sizeKB} KB` : ''}
                    </p>
                    {ocrProcessing[photo.name] && (
                      <p className={`text-xs ${theme.accentText}`}>OCR läuft...</p>
                    )}
                    {!ocrProcessing[photo.name] && photoOcrData[photo.name]?.status === 'completed' && (
                      <p className={`text-xs ${theme.textMuted} line-clamp-2`}>
                        {photoOcrData[photo.name].text}
                      </p>
                    )}
                    {!ocrProcessing[photo.name] && photoOcrData[photo.name]?.status === 'error' && (
                      <p className="text-xs text-rose-400">OCR fehlgeschlagen</p>
                    )}
                    {!ocrProcessing[photo.name] && !photoOcrData[photo.name] && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); runOcrForPhoto(photo.name, photo.url); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); runOcrForPhoto(photo.name, photo.url); } }}
                        className={`text-xs ${theme.accentText} hover:underline cursor-pointer`}
                      >
                        OCR starten
                      </span>
                    )}
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    )}

    {secondaryTab === 'visitenkarten' && (
      <>
        {businessCardsLoading ? (
          <p className={theme.textMuted}>Visitenkarten werden geladen...</p>
        ) : businessCards.length === 0 ? (
          <p className={theme.textMuted}>Keine Visitenkarten vorhanden. Importiere Kontakte mit Visitenkarten-Scan.</p>
        ) : (
          <>
            <p className={`text-sm ${theme.textMuted} mb-4`}>{businessCards.length} Visitenkarten</p>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {businessCards.map((card) => (
                <div
                  key={card.id}
                  className={`${theme.panel} rounded-xl border ${theme.border} ${theme.cardShadow} overflow-hidden hover:ring-2 hover:ring-[#F59E0B] transition-all relative group`}
                >
                  <button
                    type="button"
                    onClick={(e) => deleteBusinessCard(card, e)}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg ${theme.panel} border ${theme.border} opacity-0 group-hover:opacity-100 transition-opacity ${theme.danger} z-10`}
                    title="Visitenkarte löschen"
                  >
                    <Icons.X />
                  </button>
                  <a
                    href={card.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={card.url}
                      alt={card.contactName}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2 space-y-1">
                      <p className={`text-sm font-medium ${theme.text} truncate`}>
                        {card.contactName}
                      </p>
                      {card.company && (
                        <p className={`text-xs ${theme.textMuted} truncate`}>
                          {card.company}
                        </p>
                      )}
                      <p className={`text-xs ${theme.textMuted}`}>
                        {card.createdAt
                          ? new Date(card.createdAt).toLocaleDateString('de-DE')
                          : ''} · {card.format}
                      </p>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </>
        )}
      </>
    )}
  </>
)

export default PhotosView
