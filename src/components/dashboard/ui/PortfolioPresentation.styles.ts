import { cn } from '../../../utils/cn';
import { AssetDetailDetailStyle } from './AssetDetailDetail.styles';
import { UnderlyingAssetDetailDetailStyle } from './UnderlyingAssetDetailDetail.styles';
import { FundTransferDialogDetailStyle } from './FundTransferDialogDetail.styles';
import { PortfolioCompositionDetailStyle } from './PortfolioCompositionDetail.styles';
import { PortfolioAnalyticsDetailStyle } from './PortfolioAnalyticsDetail.styles';
import { PortfolioExcelInsightsDetailStyle } from './PortfolioExcelInsightsDetail.styles';
import { LivePortfolioPlanDetailStyle } from './LivePortfolioPlanDetail.styles';
import { PortfolioHealthDetailStyle } from './PortfolioHealthDetail.styles';
const parts = {
    'asset-detail': AssetDetailDetailStyle('asset-detail'),
    'asset-detail-loading': AssetDetailDetailStyle('asset-detail-loading'),
    'asset-detail__position-grid': AssetDetailDetailStyle('asset-detail__position-grid'),
    positive: AssetDetailDetailStyle('positive'),
    negative: AssetDetailDetailStyle('negative'),
    'section-title': AssetDetailDetailStyle('section-title'),
    'metrics-loading': AssetDetailDetailStyle('metrics-loading'),
    'metrics-grid': AssetDetailDetailStyle('metrics-grid'),
    'asset-detail__metrics-note': AssetDetailDetailStyle('asset-detail__metrics-note'),
    btn: AssetDetailDetailStyle('btn'),
    'asset-detail__metric-date': AssetDetailDetailStyle('asset-detail__metric-date'),
    'metrics-empty': AssetDetailDetailStyle('metrics-empty'),
    spinner: AssetDetailDetailStyle('spinner'),
    'spinner-sm': AssetDetailDetailStyle('spinner-sm'),
    'asset-detail__quote-market': AssetDetailDetailStyle('asset-detail__quote-market'),
    'asset-detail__purchases': AssetDetailDetailStyle('asset-detail__purchases'),
    'asset-detail__purchases-scroll': AssetDetailDetailStyle('asset-detail__purchases-scroll'),
    'underlying-detail': UnderlyingAssetDetailDetailStyle('underlying-detail'),
    'underlying-detail__context': UnderlyingAssetDetailDetailStyle('underlying-detail__context'),
    'underlying-detail__context-heading': UnderlyingAssetDetailDetailStyle('underlying-detail__context-heading'),
    'underlying-detail__context-grid': UnderlyingAssetDetailDetailStyle('underlying-detail__context-grid'),
    'underlying-detail__context-note': UnderlyingAssetDetailDetailStyle('underlying-detail__context-note'),
    'underlying-detail__loading': UnderlyingAssetDetailDetailStyle('underlying-detail__loading'),
    'underlying-detail__unavailable': UnderlyingAssetDetailDetailStyle('underlying-detail__unavailable'),
    'fund-transfer': FundTransferDialogDetailStyle('fund-transfer'),
    'fund-transfer__notice': FundTransferDialogDetailStyle('fund-transfer__notice'),
    'fund-transfer__disclaimer': FundTransferDialogDetailStyle('fund-transfer__disclaimer'),
    'fund-transfer__source': FundTransferDialogDetailStyle('fund-transfer__source'),
    'fund-transfer__execution-grid': FundTransferDialogDetailStyle('fund-transfer__execution-grid'),
    'fund-transfer__full': FundTransferDialogDetailStyle('fund-transfer__full'),
    'fund-transfer__preview': FundTransferDialogDetailStyle('fund-transfer__preview'),
    'fund-transfer__error': FundTransferDialogDetailStyle('fund-transfer__error'),
    'fund-transfer__actions': FundTransferDialogDetailStyle('fund-transfer__actions'),
    'fund-transfer__fieldset': FundTransferDialogDetailStyle('fund-transfer__fieldset'),
    'fund-transfer__destination-mode': FundTransferDialogDetailStyle('fund-transfer__destination-mode'),
    'fund-transfer__new-fund': FundTransferDialogDetailStyle('fund-transfer__new-fund'),
    'portfolio-composition__content': PortfolioCompositionDetailStyle('portfolio-composition__content'),
    'portfolio-composition__heatmap': PortfolioCompositionDetailStyle('portfolio-composition__heatmap'),
    'portfolio-composition__donut': PortfolioCompositionDetailStyle('portfolio-composition__donut'),
    'portfolio-composition__consolidated': PortfolioCompositionDetailStyle('portfolio-composition__consolidated'),
    'portfolio-composition__distributions': PortfolioCompositionDetailStyle('portfolio-composition__distributions'),
    'portfolio-composition__section-title': PortfolioCompositionDetailStyle('portfolio-composition__section-title'),
    'portfolio-composition__breakdown-status': PortfolioCompositionDetailStyle(
        'portfolio-composition__breakdown-status',
    ),
    'portfolio-composition__consolidated-header': PortfolioCompositionDetailStyle(
        'portfolio-composition__consolidated-header',
    ),
    'portfolio-composition__consolidated-note': PortfolioCompositionDetailStyle(
        'portfolio-composition__consolidated-note',
    ),
    'portfolio-composition__exposure-list': PortfolioCompositionDetailStyle('portfolio-composition__exposure-list'),
    'portfolio-composition__exposure-sections': PortfolioCompositionDetailStyle(
        'portfolio-composition__exposure-sections',
    ),
    'portfolio-composition__exposure-group': PortfolioCompositionDetailStyle('portfolio-composition__exposure-group'),
    'portfolio-analytics__kpis': PortfolioAnalyticsDetailStyle('portfolio-analytics__kpis'),
    'portfolio-analytics__body': PortfolioAnalyticsDetailStyle('portfolio-analytics__body'),
    'portfolio-analytics': PortfolioAnalyticsDetailStyle('portfolio-analytics'),
    'portfolio-analytics__empty': PortfolioAnalyticsDetailStyle('portfolio-analytics__empty'),
    'portfolio-analytics__allocation-row': PortfolioAnalyticsDetailStyle('portfolio-analytics__allocation-row'),
    'portfolio-analytics__leaders-title': PortfolioAnalyticsDetailStyle('portfolio-analytics__leaders-title'),
    'portfolio-analytics__leader': PortfolioAnalyticsDetailStyle('portfolio-analytics__leader'),
    'portfolio-analytics__alerts': PortfolioAnalyticsDetailStyle('portfolio-analytics__alerts'),
    'has-alerts': PortfolioAnalyticsDetailStyle('has-alerts'),
    'portfolio-excel-insights': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights'),
    'portfolio-excel-insights__source': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__source'),
    'portfolio-excel-insights__kpis': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__kpis'),
    'portfolio-excel-insights__comparison-dates': PortfolioExcelInsightsDetailStyle(
        'portfolio-excel-insights__comparison-dates',
    ),
    'portfolio-excel-insights__benchmark-kpis': PortfolioExcelInsightsDetailStyle(
        'portfolio-excel-insights__benchmark-kpis',
    ),
    'portfolio-excel-insights__mini-chart': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__mini-chart'),
    'portfolio-excel-insights__control-column': PortfolioExcelInsightsDetailStyle(
        'portfolio-excel-insights__control-column',
    ),
    'portfolio-excel-insights__chart-note': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__chart-note'),
    'portfolio-excel-insights__history-line': PortfolioExcelInsightsDetailStyle(
        'portfolio-excel-insights__history-line',
    ),
    'portfolio-excel-insights__empty': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__empty'),
    'portfolio-excel-insights__allocation': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__allocation'),
    'portfolio-excel-insights__controls': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__controls'),
    'portfolio-excel-insights__stats': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__stats'),
    'portfolio-excel-insights__objective-row': PortfolioExcelInsightsDetailStyle(
        'portfolio-excel-insights__objective-row',
    ),
    'portfolio-excel-insights__footnote': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__footnote'),
    'portfolio-excel-insights__link-error': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__link-error'),
    'portfolio-excel-insights__blocks': PortfolioExcelInsightsDetailStyle('portfolio-excel-insights__blocks'),
    'portfolio-excel-insights__block-categories': PortfolioExcelInsightsDetailStyle(
        'portfolio-excel-insights__block-categories',
    ),
    'live-plan-stack': LivePortfolioPlanDetailStyle('live-plan-stack'),
    'live-plan': LivePortfolioPlanDetailStyle('live-plan'),
    'live-plan__summary': LivePortfolioPlanDetailStyle('live-plan__summary'),
    'live-plan__scroll': LivePortfolioPlanDetailStyle('live-plan__scroll'),
    'live-plan__budget': LivePortfolioPlanDetailStyle('live-plan__budget'),
    'live-plan__use-weights': LivePortfolioPlanDetailStyle('live-plan__use-weights'),
    'is-positive': LivePortfolioPlanDetailStyle('is-positive'),
    'is-negative': LivePortfolioPlanDetailStyle('is-negative'),
    'live-plan__mobile-positions': LivePortfolioPlanDetailStyle('live-plan__mobile-positions'),
    'live-plan__desktop-positions': LivePortfolioPlanDetailStyle('live-plan__desktop-positions'),
    'live-plan__position': LivePortfolioPlanDetailStyle('live-plan__position'),
    'live-plan__position-main': LivePortfolioPlanDetailStyle('live-plan__position-main'),
    'portfolio-health__grid': PortfolioHealthDetailStyle('portfolio-health__grid'),
    'portfolio-health__checks': PortfolioHealthDetailStyle('portfolio-health__checks'),
    'is-ok': PortfolioHealthDetailStyle('is-ok'),
    'is-warning': PortfolioHealthDetailStyle('is-warning'),
};
export type PortfolioPresentationPart = keyof typeof parts;
export function portfolioPresentationStyle(part: PortfolioPresentationPart, className?: string) {
    return cn(parts[part], className);
}
/** Resolve retained integration hooks through static recipes; financial values stay with the caller. */
export function portfolioPresentationClasses(className?: string) {
    return cn(
        className
            ?.split(/\s+/)
            .map((token) => (Object.hasOwn(parts, token) ? parts[token as PortfolioPresentationPart] : token)),
    );
}
