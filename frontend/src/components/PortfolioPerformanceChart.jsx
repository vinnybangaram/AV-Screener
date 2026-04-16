import React, { useEffect, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact_ from 'highcharts-react-official';
const HighchartsReact = HighchartsReact_.HighchartsReact || HighchartsReact_;
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import Loader from './Common/Loader';

// Apply the custom animation logic provided by the user
const applyCustomAnimation = (H) => {
    if (H.customAnimationApplied) return;
    
    const animateSVGPath = (svgElem, animation, callback = void 0) => {
        if (!svgElem || !svgElem.element) return;
        const length = svgElem.element.getTotalLength();
        svgElem.attr({
            'stroke-dasharray': length,
            'stroke-dashoffset': length,
            opacity: 1
        });
        svgElem.animate({
            'stroke-dashoffset': 0
        }, animation, callback);
    };

    H.seriesTypes.line.prototype.animate = function (init) {
        const series = this,
            animation = H.animObject(series.options.animation);
        if (!init) {
            animateSVGPath(series.graph, animation);
        }
    };

    H.addEvent(H.Axis, 'afterRender', function () {
        const axis = this,
            chart = axis.chart,
            animation = H.animObject(chart.renderer.globalAnimation);

        if (!axis.axisGroup) return;

        axis.axisGroup
            .attr({
                opacity: 0,
                rotation: -3,
                scaleY: 0.9
            })
            .animate({
                opacity: 1,
                rotation: 0,
                scaleY: 1
            }, animation);
            
        if (axis.labelGroup) {
            if (axis.horiz) {
                axis.labelGroup
                    .attr({
                        opacity: 0,
                        rotation: 3,
                        scaleY: 0.5
                    })
                    .animate({
                        opacity: 1,
                        rotation: 0,
                        scaleY: 1
                    }, animation);
            } else {
                axis.labelGroup
                    .attr({
                        opacity: 0,
                        rotation: 3,
                        scaleX: -0.5
                    })
                    .animate({
                        opacity: 1,
                        rotation: 0,
                        scaleX: 1
                    }, animation);
            }
        }

        if (axis.plotLinesAndBands) {
            axis.plotLinesAndBands.forEach(plotLine => {
                const animation = H.animObject(plotLine.options.animation);
                if (plotLine.label) {
                    plotLine.label.attr({ opacity: 0 });
                }
                if (plotLine.svgElem) {
                    animateSVGPath(
                        plotLine.svgElem,
                        animation,
                        function () {
                            if (plotLine.label) {
                                plotLine.label.animate({ opacity: 1 });
                            }
                        }
                    );
                }
            });
        }
    });
    
    H.customAnimationApplied = true;
};

const PortfolioPerformanceChart = ({ timeframe = 'This Month', category = 'All', mode = 'return' }) => {
    const [options, setOptions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        applyCustomAnimation(Highcharts);
    }, []);

    useEffect(() => {
        const fetchPortfolioTrend = async () => {
            setLoading(true);
            try {
                const daysMap = { 'Today': 1, 'This Week': 7, 'This Month': 30, 'This Year': 365 };
                const days = daysMap[timeframe] || 30;
                
                const response = await axios.get(`${API_BASE_URL}/chart/portfolio`, {
                    params: { days, category },
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });

                const rawData = response.data;
                const symbols = Object.keys(rawData);
                
                if (symbols.length === 0) {
                    setOptions('EMPTY');
                    setLoading(false);
                    return;
                }

                const series = symbols.map((symbol, idx) => ({
                    name: symbol,
                    data: rawData[symbol].map(d => [
                        new Date(d.date).getTime(), 
                        mode === 'return' ? d.indexed : d.close // Simplified P/L representation
                    ]),
                    animation: {
                        duration: 1000,
                        defer: idx * 200 // Staggered entrance
                    }
                }));

                setOptions({
                    chart: {
                        type: 'spline',
                        backgroundColor: 'transparent',
                        height: 380,
                        style: { fontFamily: 'inherit' },
                        spacingTop: 30,
                    },
                    title: { text: null },
                    xAxis: {
                        type: 'datetime',
                        gridLineWidth: 1,
                        gridLineColor: 'rgba(255,255,255,0.03)',
                        lineColor: 'rgba(255,255,255,0.1)',
                        labels: { style: { color: 'var(--text-muted)', fontWeight: '700' } }
                    },
                    yAxis: {
                        title: { 
                            text: mode === 'return' ? 'Alpha Performance (%)' : 'Market Value (₹)', 
                            style: { color: 'var(--text-muted)', fontWeight: '800' } 
                        },
                        gridLineColor: 'rgba(255,255,255,0.03)',
                        labels: { 
                            style: { color: 'var(--text-muted)' },
                            formatter: function() {
                                return mode === 'return' ? this.value + '%' : '₹' + (this.value >= 1000 ? (this.value/1000).toFixed(1) + 'k' : this.value);
                            }
                        },
                        plotLines: mode === 'return' ? [{
                            color: 'rgba(255,255,255,0.2)',
                            width: 1,
                            value: 0,
                            dashStyle: 'Dash',
                            label: { text: 'Baseline', style: { color: 'var(--text-muted)', fontSize: '10px' } }
                        }] : []
                    },
                    legend: {
                        itemStyle: { color: 'var(--text-muted)', fontWeight: '700' },
                        itemHoverStyle: { color: '#fff' }
                    },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        borderColor: '#334155',
                        borderRadius: 12,
                        style: { color: '#fff' },
                        shared: true,
                        valueDecimals: 2,
                        valuePrefix: mode === 'return' ? '' : '₹',
                        valueSuffix: mode === 'return' ? '%' : ''
                    },
                    plotOptions: {
                        series: {
                            lineWidth: 3,
                            marker: { enabled: false },
                            states: { hover: { lineWidth: 4 } }
                        }
                    },
                    series: series,
                    credits: { enabled: false }
                });
            } catch (error) {
                console.error("Performance Chart Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolioTrend();
    }, [timeframe, category]);

    if (loading) return <div style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader message="Rendering Alpha Performance..." /></div>;
    
    if (options === 'EMPTY') return (
        <div style={{ height: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <p>No enough snapshots to generate performance trend.</p>
            <span style={{ fontSize: '0.75rem' }}>Minimum 2 snapshots required for comparison.</span>
        </div>
    );

    return (
        <div className="portfolio-performance-intelligence">
             {options && <HighchartsReact highcharts={Highcharts} options={options} />}
        </div>
    );
};

export default PortfolioPerformanceChart;
