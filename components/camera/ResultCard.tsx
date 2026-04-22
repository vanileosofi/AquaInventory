import { CheckCircle, FlaskConical, RotateCcw, ShoppingBag, Star } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MixStep as FavMixStep, getListIdsContainingItem } from '../../storage/favorites';
import { BuyOption, CameraAnalysis, InventoryMatch, MixStep } from '../../services/geminiVision';
import SaveToListModal, { SavePayload } from '../favorites/SaveToListModal';

interface Props {
  analysis: CameraAnalysis;
  croppedUri: string | null;
  onReset: () => void;
}

export default function ResultCard({ analysis, croppedUri, onReset }: Props) {
  const { t } = useTranslation();
  const { result, inventoryMatches, status } = analysis;
  const [savePayload, setSavePayload] = useState<SavePayload | null>(null);
  const [savedTypes, setSavedTypes] = useState<Set<string>>(new Set());

  const refreshSavedTypes = useCallback(async () => {
    const checks: [string, Parameters<typeof getListIdsContainingItem>[0]][] = [
      ['detected', { type: 'detected', hex: result.hex || '#000000', name: result.name || '—', brand: result.brand ?? undefined }],
    ];
    if (result.mix_recipe?.length) {
      checks.push(['mix', { type: 'mix', hex: result.hex || '#000000', name: result.name || '—', brand: undefined }]);
    }
    if (result.buy_technical) {
      checks.push(['technical', { type: 'technical', hex: result.buy_technical.hex, name: result.buy_technical.name, brand: result.buy_technical.brand }]);
    }
    if (result.buy_compatible) {
      checks.push(['compatible', { type: 'compatible', hex: result.buy_compatible.hex, name: result.buy_compatible.name, brand: result.buy_compatible.brand }]);
    }
    const saved = new Set<string>();
    for (const [type, payload] of checks) {
      const ids = await getListIdsContainingItem(payload);
      if (ids.length > 0) saved.add(type);
    }
    setSavedTypes(saved);
  }, [result]);

  useEffect(() => {
    refreshSavedTypes();
  }, [refreshSavedTypes]);

  const buildDetectedPayload = (): SavePayload => ({
    type: 'detected',
    hex: result.hex || '#000000',
    name: result.name || '—',
    brand: result.brand ?? undefined,
  });

  const buildMixPayload = (): SavePayload => ({
    type: 'mix',
    hex: result.hex || '#000000',
    name: result.name || '—',
    brand: undefined,
    mix_recipe: result.mix_recipe?.map((step): FavMixStep => ({
      colorName: step.name,
      hex: step.hex,
      proportion: `${step.parts}p`,
    })),
  });

  const buildBuyPayload = (option: BuyOption, type: 'technical' | 'compatible'): SavePayload => ({
    type,
    hex: option.hex || '#000000',
    name: option.name,
    brand: option.brand,
  });

  const openSaveModal = (payload: SavePayload) => {
    if (!payload.name || payload.name === '—') {
      Alert.alert(t('common.error'), t('favorites.name_required'));
      return;
    }
    setSavePayload(payload);
  };

  return (
    <View style={styles.container}>

      {/* Imagen recortada + color identificado */}
      <View style={styles.identifiedCard}>
        {croppedUri && (
          <Image source={{ uri: croppedUri }} style={styles.croppedImage} resizeMode="cover" />
        )}
        <View style={styles.identifiedRight}>
          <View style={styles.identifiedTop}>
            <View style={[styles.colorDot, { backgroundColor: result.hex || '#ccc' }]} />
            <View style={styles.identifiedMeta}>
              <Text style={styles.identifiedName}>{result.name || '—'}</Text>
              <Text style={styles.identifiedBrand}>
                {result.brand || t('camera.brand_unknown')}
                {result.number ? `  ·  ${result.number}` : ''}
              </Text>
            </View>
            <StarButton
              saved={savedTypes.has('detected')}
              onPress={() => openSaveModal(buildDetectedPayload())}
            />
          </View>
          <View style={styles.hexBadge}>
            <Text style={styles.hexText}>{result.hex || '—'}</Text>
          </View>
        </View>
      </View>

      {/* Status banner */}
      <StatusBanner status={status} t={t} />

      {/* Coincidencias en inventario */}
      {inventoryMatches.length > 0 && (
        <Section title={t('camera.inventory_matches')}>
          {inventoryMatches.map(m => (
            <MatchRow key={m.id} match={m} t={t} />
          ))}
        </Section>
      )}

      {/* Receta de mezcla — siempre que exista */}
      {result.mix_recipe && result.mix_recipe.length > 0 && (
        <Section
          title={t('camera.mix_recipe')}
          rightAction={
            <StarButton
              saved={savedTypes.has('mix')}
              onPress={() => openSaveModal(buildMixPayload())}
            />
          }
        >
          <MixRecipe steps={result.mix_recipe} />
        </Section>
      )}

      {/* Recomendaciones de compra */}
      {(result.buy_technical || result.buy_compatible) && (
        <Section title={t('camera.buy_title')}>
          {result.buy_technical && (
            <BuyCard
              tag={t('camera.buy_technical')}
              option={result.buy_technical}
              saved={savedTypes.has('technical')}
              onSave={() => openSaveModal(buildBuyPayload(result.buy_technical!, 'technical'))}
            />
          )}
          {result.buy_compatible && (
            <BuyCard
              tag={t('camera.buy_compatible')}
              option={result.buy_compatible}
              saved={savedTypes.has('compatible')}
              onSave={() => openSaveModal(buildBuyPayload(result.buy_compatible!, 'compatible'))}
            />
          )}
        </Section>
      )}

      {/* Notas de la IA */}
      {result.notes ? (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>{t('camera.ai_notes')}</Text>
          <Text style={styles.notesText}>{result.notes}</Text>
        </View>
      ) : null}

      {/* Nueva foto */}
      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <RotateCcw size={15} color="#888" />
        <Text style={styles.resetBtnLabel}>{t('camera.new_photo')}</Text>
      </TouchableOpacity>

      {/* Modal de guardar en lista */}
      <SaveToListModal
        visible={savePayload !== null}
        item={savePayload}
        onClose={() => { setSavePayload(null); refreshSavedTypes(); }}
      />

    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StarButton({ onPress, saved }: { onPress: () => void; saved?: boolean }) {
  return (
    <TouchableOpacity
      style={styles.starBtn}
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Star size={16} color={saved ? '#F5A623' : '#3B44AC'} fill={saved ? '#F5A623' : 'none'} />
    </TouchableOpacity>
  );
}

function StatusBanner({ status, t }: { status: string; t: any }) {
  const config: Record<string, { icon: React.ReactNode; bg: string; border: string; title: string; desc: string }> = {
    found: {
      icon: <CheckCircle size={20} color="#2e7d32" />,
      bg: '#f0faf1',
      border: '#2e7d32',
      title: t('camera.status_found_title'),
      desc: t('camera.status_found_desc'),
    },
    mix: {
      icon: <FlaskConical size={20} color="#e65100" />,
      bg: '#fff8f0',
      border: '#e65100',
      title: t('camera.status_mix_title'),
      desc: t('camera.status_mix_desc'),
    },
    buy: {
      icon: <ShoppingBag size={20} color="#3B44AC" />,
      bg: '#f0f1ff',
      border: '#3B44AC',
      title: t('camera.status_buy_title'),
      desc: t('camera.status_buy_desc'),
    },
  };
  const c = config[status] ?? config.buy;
  return (
    <View style={[styles.banner, { backgroundColor: c.bg, borderLeftColor: c.border }]}>
      {c.icon}
      <View style={styles.bannerText}>
        <Text style={styles.bannerTitle}>{c.title}</Text>
        <Text style={styles.bannerDesc}>{c.desc}</Text>
      </View>
    </View>
  );
}

function Section({
  title,
  children,
  rightAction,
}: {
  title: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {rightAction}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function MatchRow({ match, t }: { match: InventoryMatch; t: any }) {
  return (
    <View style={styles.matchRow}>
      <View style={[styles.matchSwatch, { backgroundColor: match.hex }]} />
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>{match.name}</Text>
        <Text style={styles.matchBrand}>{match.brand || '—'}</Text>
      </View>
      <View style={styles.matchPct}>
        <Text style={styles.matchPctValue}>{match.similarity}%</Text>
        <Text style={styles.matchPctLabel}>{t('camera.similarity')}</Text>
      </View>
    </View>
  );
}

function MixRecipe({ steps }: { steps: MixStep[] }) {
  const total = steps.reduce((s, r) => s + (r.parts || 1), 0);
  return (
    <View style={styles.recipeList}>
      {steps.map((step, i) => {
        const pct = Math.round((step.parts / total) * 100);
        return (
          <View key={i} style={styles.recipeRow}>
            <Text style={styles.recipeParts}>{step.parts}p</Text>
            <View style={styles.recipeBarWrap}>
              <View style={[styles.recipeBar, { width: `${pct}%`, backgroundColor: step.hex || '#aaa' }]} />
            </View>
            <Text style={styles.recipeColorName} numberOfLines={1}>{step.name}</Text>
          </View>
        );
      })}
    </View>
  );
}

function BuyCard({ tag, option, onSave, saved }: { tag: string; option: BuyOption; onSave?: () => void; saved?: boolean }) {
  return (
    <View style={styles.buyCard}>
      <View style={styles.buyTagRow}>
        <Text style={styles.buyTag}>{tag}</Text>
        {onSave && <StarButton onPress={onSave} saved={saved} />}
      </View>
      <View style={styles.buySwatchRow}>
        <View style={[styles.buySwatch, { backgroundColor: option.hex || '#ccc' }]} />
        <View style={styles.buyMeta}>
          <Text style={styles.buyName}>{option.name}</Text>
          <Text style={styles.buyBrand}>{option.brand}</Text>
        </View>
      </View>
      {option.reason ? <Text style={styles.buyReason}>{option.reason}</Text> : null}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { gap: 12 },

  identifiedCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    alignItems: 'center',
  },
  croppedImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    flexShrink: 0,
  },
  identifiedRight: {
    flex: 1,
    gap: 8,
  },
  identifiedTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    flexShrink: 0,
  },
  identifiedMeta: { flex: 1 },
  identifiedName: { fontSize: 15, fontWeight: '600', color: '#111' },
  identifiedBrand: { fontSize: 12, color: '#888', marginTop: 2 },
  hexBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fff',
  },
  hexText: { fontSize: 11, color: '#888', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  bannerDesc: { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 17 },

  section: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  starBtn: {
    padding: 4,
  },

  sectionBody: { padding: 12, gap: 2 },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  matchSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  matchInfo: { flex: 1 },
  matchName: { fontSize: 15, fontWeight: '600', color: '#111' },
  matchBrand: { fontSize: 12, color: '#888', marginTop: 2 },
  matchPct: { alignItems: 'flex-end' },
  matchPctValue: { fontSize: 20, fontWeight: '700', color: '#2e7d32' },
  matchPctLabel: { fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: 0.5 },

  recipeList: { gap: 10 },
  recipeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recipeParts: { width: 28, fontSize: 12, fontWeight: '600', color: '#3B44AC', textAlign: 'right' },
  recipeBarWrap: { flex: 1, height: 16, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  recipeBar: { height: '100%', borderRadius: 4 },
  recipeColorName: { width: 120, fontSize: 12, color: '#333' },

  buyCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  buyTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buyTag: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    flex: 1,
  },
  buySwatchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  buySwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  buyMeta: { flex: 1 },
  buyName: { fontSize: 14, fontWeight: '600', color: '#111' },
  buyBrand: { fontSize: 12, color: '#888', marginTop: 2 },
  buyReason: {
    fontSize: 12,
    color: '#666',
    lineHeight: 17,
    fontStyle: 'italic',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },

  notesBox: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ddd',
    gap: 4,
  },
  notesLabel: { fontSize: 14, fontWeight: '600', color: '#444' },
  notesText: { fontSize: 13, color: '#666', lineHeight: 19, fontStyle: 'italic' },

  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', paddingVertical: 8 },
  resetBtnLabel: { fontSize: 13, color: '#888', textDecorationLine: 'underline' },
});
