import { CheckCircle, FlaskConical, RotateCcw, ShoppingBag } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BuyOption, CameraAnalysis, InventoryMatch, MixStep } from '../../services/geminiVision';

interface Props {
  analysis: CameraAnalysis;
  croppedUri: string | null;
  onReset: () => void;
}

export default function ResultCard({ analysis, croppedUri, onReset }: Props) {
  const { t } = useTranslation();
  const { result, inventoryMatches, status } = analysis;

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
          {inventoryMatches.map(m => <MatchRow key={m.id} match={m} t={t} />)}
        </Section>
      )}

      {/* Receta de mezcla — siempre que exista */}
      {result.mix_recipe && result.mix_recipe.length > 0 && (
        <Section title={t('camera.mix_recipe')}>
          <MixRecipe steps={result.mix_recipe} />
        </Section>
      )}

      {/* Recomendaciones de compra */}
      {(result.buy_technical || result.buy_compatible) && (
        <Section title={t('camera.buy_title')}>
          {result.buy_technical && (
            <BuyCard tag={t('camera.buy_technical')} option={result.buy_technical} />
          )}
          {result.buy_compatible && (
            <BuyCard tag={t('camera.buy_compatible')} option={result.buy_compatible} />
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

    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
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

function BuyCard({ tag, option }: { tag: string; option: BuyOption }) {
  return (
    <View style={styles.buyCard}>
      <Text style={styles.buyTag}>{tag}</Text>
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
 buyTag: {
  fontSize: 14,
  fontWeight: '600',
  color: '#444',
  paddingBottom: 8,
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
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