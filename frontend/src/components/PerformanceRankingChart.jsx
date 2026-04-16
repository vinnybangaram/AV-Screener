import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact_ from 'highcharts-react-official';

const HighchartsReact = HighchartsReact_.HighchartsReact || HighchartsReact_;

const PerformanceRankingChart = ({ data = [] }) => {
    const options = useMemo(() => {
        if (!data || data.length === 0) return null;

        const categories = data.map(item => item.name);
        const values = data.map(item => ({
            y: item.value,
            color: item.value >= 0 ? '#10b981' : '#f43f5e'
        }));

        return {
            chart: {
                type: 'column',
                backgroundColor: 'transparent',
                height: 250,
                style: { fontFamily: 'inherit' }
            },
            title: { text: null },
            xAxis: {
                categories: categories,
                gridLineWidth: 0,
                lineColor: 'rgba(255,255,255,0.1)',
                labels: {
                    style: { color: 'var(--text-muted)', fontWeight: '700', fontSize: '10px' }
                }
            },
            yAxis: {
                title: { text: null },
                gridLineColor: 'rgba(255,255,255,0.03)',
                labels: {
                    format: '{value}%',
                    style: { color: 'var(--text-muted)' }
                },
                plotLines: [{
                    color: 'rgba(255,255,255,0.1)',
                    width: 1,
                    value: 0
                }]
            },
            legend: { enabled: false },
            credits: { enabled: false },
            tooltip: {
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderRadius: 12,
                style: { color: '#fff' },
                pointFormat: 'P/L: <b>{point.y:.2f}%</b>'
            },
            plotOptions: {
                column: {
                    borderRadius: '25%',
                    borderWidth: 0,
                    groupPadding: 0.1,
                    pointPadding: 0.1
                }
            },
            series: [{
                name: 'Performance',
                data: values
            }]
        };
    }, [data]);

    if (!options) return (
        <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            No ranking data available
        </div>
    );

    return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default PerformanceRankingChart;
