        //set formats. valid values 'i' 'w' 'e' 'p'
        var format = getURLParameter('format');
        if (format == null) {
            format = 'wpei';
        }

        //set button size
        var size = getURLParameter('size');
        if (size == null) {
            size = '50';
        }

        //set background colour
        var background = getURLParameter('background');
        if (background == null) {} else {
            document.body.style.backgroundColor = '#' + background;
        }
			
		showButtons();

        // Click handlers
        function onExportClicked(format) {
			var TBLib = new TableauLib();
			var CurrentViz = TBLib.getCurrentViz();
			var Worksheets = TBLib.getAllWorksheets();
			var hostname = CurrentViz._impl.$1n.host_url;
			var sitePath = CurrentViz.getUrl().split('/views/')[0];
			var path = CurrentViz.getUrl().split('/views/')[1];
			var workbookName = CurrentViz.getWorkbook().getName();

            var xsrf = getCookie('XSRF-TOKEN');
            //console.log(xsrf);
            //use vizportal api to get list of all views for current workbook
            var h = {
                'Accept': 'application/json, text/plain, */*',
                'X-XSRF-TOKEN': xsrf,
                'Content-Type': 'application/json;charset=UTF-8',
            }
            var d = '{"method":"getViewByPath","params":{"path":"' + path + '"}}'

            var getViewByPathUrl = hostname + '/vizportal/api/web/v1/getViewByPath'
            var xhr = $.ajax({
                url: getViewByPathUrl,
                method: "POST",
                headers: h,
                data: d,
                success: function(data) {
                    //console.log(data);
                    showLoader();
                    var currentVizId = data.result.id;
                    var currentVizName = data.result.name;
                    var workbookId = data.result.workbook.id;

                    //get views
                    var getViewsUrl = hostname + '/vizportal/api/web/v1/getViews'
                    d = '{"method":"getViews","params":{"filter":{"operator":"and","clauses":[{"operator":"eq","field":"workbookId","value":"' + workbookId + '"}]},"order":[{"field":"index","ascending":true}],"page":{"startIndex":0,"maxItems":128},"statFields":["hitsTotal","hitsLastOneMonthTotal","hitsLastThreeMonthsTotal","hitsLastTwelveMonthsTotal","favoritesTotal"]}}'
                    var xhr = $.ajax({
                        url: getViewsUrl,
                        method: "POST",
                        headers: h,
                        data: d,
                        success: function(data) {
                            //console.log(data);
                            var views = data.result.views;

                            //PPT EXPORT
                            if (format == 'ppt') {
                                // STEP 1: Create a new Presentation
                                var pptx = new PptxGenJS();
                                // STEP 2: Add a new Slides to the Presentation
                                for (i = 0; i < views.length; i++) {

                                    var viewId = views[i].id;
                                    var viewPath = views[i].path;
                                    var viewUrl = sitePath + '/views/' + viewPath;
                                    var pngUrl = hostname + '/vizql/sheetimage/' + viewId + '?:pixelratio=2';

                                    var slide = pptx.addNewSlide();
                                    // STEP 3: Add any objects to the Slide (charts, tables, shapes, images, etc.)
                                    slide.addImage({
                                        path: pngUrl,
                                        x: 0,
                                        y: 0,
                                        w: '100%',
                                        h: '100%',
                                        hyperlink: {
                                            url: viewUrl,
                                            tooltip: 'Click To Open Viz With Tableau Server'
                                        },
                                        sizing: {
                                            type: 'contain',
                                            w: '100%',
                                            h: '100%'
                                        }
                                    });
                                }

                                // STEP 4: Send the PPTX Presentation to the user, using your choice of file name
                                pptx.save(workbookName + '.pptx', function() {
                                    showButtons()
                                });
                            }

                            //WORD EXPORT
                            if (format == 'word') {
                                var body = '';
                                var i = 0;
                                makeWordDoc(i);

                                function makeWordDoc(i) {
                                    var viewId = views[i].id;
                                    var viewPath = views[i].path;
                                    var viewUrl = sitePath + '/views/' + viewPath;
                                    var pngUrl = hostname + '/vizql/sheetimage/' + viewId + '?:pixelratio=2';
                                    toDataUrl(pngUrl, function(myBase64) {

                                        var image = new Image();
                                        image.onload = function() {
                                            //console.log("Loaded image: " + image.width + "x" + image.height);
                                            var percent = 600 / image.width
                                            var height = image.height * percent;
                                            var width = 600;

                                            body = body + '<p><a href="' + viewUrl + '"><img src="' + myBase64 + '" alt="" data-mce-src="' + workbookName + '.png" height=' + height + ' width=' + width + '></p>'
                                            i++;

                                            if (i == views.length) {
                                                var orientation = 'portrait';
                                                var content = '<!DOCTYPE html><html><head>' + body + '</head></body></html>'
                                                var converted = htmlDocx.asBlob(body, {
                                                    orientation: orientation
                                                });
                                                download(converted, workbookName + '.docx');
                                                showButtons();
                                            } else {
                                                makeWordDoc(i)
                                            }
                                        };
                                        image.src = myBase64;
                                    })
                                }
                            }

                            //IMAGE EXPORT
                            if (format == 'image') {
                                var viewId = currentVizId;
                                var pngUrl = hostname + 'vizql/sheetimage/' + viewId + '?:pixelratio=2';
                                toDataUrl(pngUrl, function(myBase64) {
                                    //console.log(myBase64);
                                    download(myBase64, currentVizName + '.png', "image/png")
                                    showButtons();
                                })
                            }

                            //EXCEL EXPORT				
                            if (format == 'excel') {
                                //write image to first tab
                                var viewId = currentVizId;
                                var pngUrl = hostname + 'vizql/sheetimage/' + viewId + '?:pixelratio=2';
                                var wb = new Workbook();
                                var ws_name = currentVizName + ' Viz';
                                wb.SheetNames.push(ws_name);
                                var ws = {};
                                var rows = $("#table tr");
                                var rowsCount = rows.length;
                                var colsCount = $(rows[0]).find("td").length;
                                wb.Sheets[ws_name] = ws;

                                toDataUrl(pngUrl, function(myBase64) {

                                    var myBase = myBase64.split('data:image/png;base64,')[1];
                                    //console.log(myBase);
                                    ws["!images"] = [];
                                    ws["!images"].push({
                                        name: 'image' + '.png',
                                        data: myBase,
                                        opts: {
                                            base64: true
                                        },
                                        type: "png",
                                        position: {
                                            type: 'twoCellAnchor',
                                            attrs: {
                                                editAs: 'oneCell'
                                            },
                                            from: {
                                                col: 0,
                                                row: 0
                                            },
                                            to: {
                                                col: 15,
                                                row: 30
                                            }
                                        }
                                    });

                                    //write summary data for each view on dashboard
                                    var sheetNames = [];
                                    var exportData = [];
                                    var i = 0;
                                    options = {
                                        maxRows: 0,
                                        ignoreSelection: true,
                                        includeAllColumns: false
                                    };
                                    //console.log(Worksheets)
                                    writeExcelData(0);

                                    function writeExcelData(i) {
                                        var sheetName = Worksheets[i].getName();
                                        sheetNames.push({
                                            sheetid: sheetName,
                                            header: true
                                        })
                                        Worksheets[i].getSummaryDataAsync(options).then(function(t) {

                                            var ExcelData = buildData(t);
                                            //console.log(ExcelData);
                                            exportData.push(ExcelData);

                                            //console.log(sheetName);
                                            //console.log(t);
                                            //add data to excel workbook
                                            wb.SheetNames.push(sheetName);
                                            wb.Sheets[sheetName] = XLSX.utils.json_to_sheet(ExcelData);


                                            i++;
                                            if (i == Worksheets.length) {
                                                //console.log(wb);
                                                var wbout = XLSX.write(wb, {
                                                    bookType: 'xlsx',
                                                    bookSST: true,
                                                    type: 'binary'
                                                });


                                                //save excel workbook
                                                var fname = currentVizName + '.xlsx';
                                                try {
                                                    saveAs(new Blob([s2ab(wbout)], {
                                                        type: "application/octet-stream"
                                                    }), fname);
                                                } catch (e) {
                                                    if (typeof console != 'undefined')
                                                        console.log(e, wbout);
                                                }
                                                showButtons();
                                                return wbout;
                                            } else {
                                                writeExcelData(i);
                                            }
                                        });
                                    }
                                })
                            }
                        }
                    })
                }
            })
        }

        function Workbook() {
            if (!(this instanceof Workbook)) return new Workbook();
            this.SheetNames = [];
            this.Sheets = {};
        }

        function onDataLoadError(err) {
            return console.error("Error during Tableau Async request:", err);
        }

        function buildData(table) {
            var columns = table.getColumns();
            var data = table.getData();

            function reduceToObjects(cols, data) {
                var fieldNameMap = $.map(cols, function(col) {
                    return col.getFieldName()
                });
                var dataToReturn = $.map(data, function(d) {
                    return d.reduce(function(memo, value, idx) {
                        memo[fieldNameMap[idx]] = value.value;
                        return memo;
                    }, {});
                });
                return dataToReturn;
            }

            var niceData = reduceToObjects(columns, data);
            return (niceData)
        }

        function writeToFile() {
            if (doneSheets == sheets.length) {
                var sql = 'SELECT INTO XLSX("' + dashboardname + '.xlsx",?) FROM ?';
                var res = alasql(sql, [sheetNames, exportData]);
            }
        }

        function getCookie(name) {
            var value = "; " + document.cookie;
            var parts = value.split("; " + name + "=");
            if (parts.length == 2) return parts.pop().split(";").shift();
        }


        function toDataUrl(url, callback) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var reader = new FileReader();
                reader.onloadend = function() {
                    callback(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        }

        function s2ab(s) {
            if (typeof ArrayBuffer !== 'undefined') {
                var buf = new ArrayBuffer(s.length);
                var view = new Uint8Array(buf);
                for (var i = 0; i != s.length; ++i)
                    view[i] = s.charCodeAt(i) & 0xFF;
                return buf;
            } else {
                var buf = new Array(s.length);
                for (var i = 0; i != s.length; ++i)
                    buf[i] = s.charCodeAt(i) & 0xFF;
                return buf;
            }
        }

        function getURLParameter(name) {
            return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
        }

        function showButtons() {
            document.getElementById("loader").style.display = "none";
            var html = '';
            if (format.indexOf("p") >= 0) {
                html += '<button class="btn btn-ppt" style="height:' + size + 'px;width:' + size + 'px" id="btn-ppt" onclick="onExportClicked(\'ppt\')"></button>'
            }
            if (format.indexOf("w") >= 0) {
                html += '<button class="btn btn-word" style="height:' + size + 'px;width:' + size + 'px" id="btn-word" onclick="onExportClicked(\'word\')"></button>'
            }
            if (format.indexOf("e") >= 0) {
                html += '<button class="btn btn-excel" style="height:' + size + 'px;width:' + size + 'px" id="btn-excel" onclick="onExportClicked(\'excel\')"></button>'
            }
            if (format.indexOf("i") >= 0) {
                html += '<button class="btn btn-img" style="height:' + size + 'px;width:' + size + 'px" id="btn-img" onclick="onExportClicked(\'image\')"></button>'
            }
            document.getElementById("buttons").innerHTML = html;
        }

        function showLoader() {
            document.getElementById("buttons").innerHTML = ''
            document.getElementById("loader").style.display = "block";
        }
