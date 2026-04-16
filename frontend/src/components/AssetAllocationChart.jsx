import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact_ from 'highcharts-react-official';

const HighchartsReact = HighchartsReact_.HighchartsReact || HighchartsReact_;

const AssetAllocationChart = ({ watchlist = [] }) => {
    const options = useMemo(() => {
        if (!watchlist || watchlist.length === 0) return null;

        const categoryData = {};
        // Premium Vibrant Palette
        const palette = [
            '#6366f1', // Indigo
            '#10b981', // Emerald
            '#f43f5e', // Rose
            '#f59e0b', // Amber
            '#8b5cf6', // Violet
            '#06b6d4', // Cyan
            '#d946ef', // Fuchsia
            '#2dd4bf'  // Teal
        ];
        
        // Group by category
        watchlist.forEach(item => {
            const cat = item.category || 'Core';
            const val = (item.latest_price || 0) * (item.quantity || 0);
            if (val <= 0) return;

            if (!categoryData[cat]) {
                categoryData[cat] = { y: 0, stocks: [] };
            }
            categoryData[cat].y += val;
            categoryData[cat].stocks.push({ name: item.symbol, y: val });
        });

        const categories = Object.keys(categoryData);
        if (categories.length === 0) return null;

        const innerData = [];
        const outerData = [];

        categories.forEach((cat, i) => {
            const catColor = palette[i % palette.length];
            
            // Inner Ring: Categories
            innerData.push({
                name: cat,
                y: categoryData[cat].y,
                color: catColor
            });

            // Outer Ring: Stocks
            const stocks = categoryData[cat].stocks.sort((a,b) => b.y - a.y);
            stocks.forEach((stock, j) => {
                // More aggressive brightness variation for better stock differentiation
                const brightness = 0.2 - (j / Math.max(stocks.length, 1)) * 0.4; 
                outerData.push({
                    name: stock.name,
                    y: stock.y,
                    color: Highcharts.color(catColor).brighten(brightness).get()
                });
            });
        });

        return {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent',
                height: 300,
                style: { fontFamily: 'inherit' }
            },
            title: { text: null },
            plotOptions: {
                pie: {
                    shadow: false,
                    center: ['50%', '50%'],
                    borderWidth: 0, // Clean glass look
                    cursor: 'pointer'
                }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: 12,
                style: { color: '#fff' },
                formatter: function() {
                    return `<b>${this.point.name}</b>: ₹${this.y.toLocaleString('en-IN')}<br/>(${this.percentage.toFixed(1)}%)`;
                }
            },
            series: [
                {
                    name: 'Category',
                    data: innerData,
                    size: '60%',
                    dataLabels: {
                        color: '#ffffff',
                        distance: -30,
                        formatter: function() {
                            return this.percentage > 10 ? this.point.name : null;
                        },
                        style: { fontSize: '10px', fontWeight: '900', textOutline: 'none' }
                    }
                },
                {
                    name: 'Stocks',
                    data: outerData,
                    size: '95%',
                    innerSize: '65%',
                    dataLabels: {
                        format: '<b>{point.name}:</b> {point.percentage:.1f}%',
                        style: { fontSize: '9px', fontWeight: '500', color: 'var(--text-muted)' },
                        filter: {
                            property: 'percentage',
                            operator: '>',
                            value: 3
                        }
                    },
                    id: 'stocks'
                }
            ],
            credits: { enabled: false }
        };
    }, [watchlist]);

    if (!options) return (
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No Asset Data
        </div>
    );

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default AssetAllocationChart;
