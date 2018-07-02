const { S3 } = require("aws-sdk");
const exporter = require('highcharts-export-server');

const s3_client = new S3();

function CreateChart(settings) {
    return new Promise((resolve, reject) => {
        exporter.export(settings, (err, res) =>{
            if (err) return reject(err);
            resolve(res);
        });
    })
}

exports.handler = async () => {
    exporter.initPool();

    const chart_settings = {
        type: 'png',
        options: {
            title: {
                text: 'My Chart'
            },
            xAxis: {
                categories: ["Jan", "Feb", "Mar", "Apr", "Mar", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            },
            series: [
                {
                    type: 'line',
                    data: [1, 3, 2, 4]
                },
                {
                    type: 'line',
                    data: [5, 3, 4, 2]
                }
            ]
        }
    };

    try {
        let chart = await CreateChart(chart_settings);
        chart.renderer.label('This label is added in the callback', 100, 100)
            .attr({
                fill : '#90ed7d',
                padding: 10,
                r: 10,
                zIndex: 10
            })
            .css({
                color: 'black',
                width: '100px'
            })
            .add();
            
        let data = new Buffer(chart.data, "base64");
        await s3_client.putObject({ Bucket: process.env.BUCKETNAME, Key: `my-chart.png`, Body: data }).promise();
    }
    catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
    }

    exporter.killPool();
};