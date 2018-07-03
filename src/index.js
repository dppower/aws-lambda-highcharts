const { S3 } = require("aws-sdk");
const exporter = require('highcharts-export-server');
const qs = require('qs');

const s3_client = new S3();

function CreateChart(settings) {
    return new Promise((resolve, reject) => {
        exporter.export(settings, (err, res) =>{
            if (err) return reject(err);
            resolve(res);
        });
    })
}

exports.handler = async (event) => {
    exporter.initPool();
    
    let chart_settings
    if (event.params.header["Content-Type"] === "application/x-www-form-urlencoded") {
        chart_settings = qs.parse(event.body);
    }
    else {
        chart_settings = JSON.parse(event.body);
    }
    console.log(chart_settings);
    let title = (chart_settings.options && chart_settings.options.title && chart_settings.options.title.text) || `${Date.now()}-test-chart`;
    title = title.toLowerCase().split(' ').join('-') + "-" + Date.now();
    let ext = chart_settings.type;
    if (ext) {
        title += "." + ext;
    }

    try {
        let chart = await CreateChart(chart_settings);
        let data = new Buffer(chart.data, "base64");
        await s3_client.putObject({ Bucket: process.env.BUCKETNAME, Key: title, Body: data }).promise();
    }
    catch (e) {
        console.log(`error: ${JSON.stringify(e)}`);
        return {
            statusCode: 500
        };
    }

    exporter.killPool();

    return {
        statusCode: 200,
        body: JSON.stringify({title})
    };
};