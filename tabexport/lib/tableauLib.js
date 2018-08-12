var TableauLib = (function () {
    function TableauLib() {
    }
    TableauLib.prototype.getTableau = function () {
        if (!parent || !parent.parent) {
            return null;
        }
        var grandParent = parent.parent;
        return grandParent.tableau;
    };
    TableauLib.prototype.getCurrentViz = function () {
        var tableau = this.getTableau();
        if (!tableau) {
            return null;
        }
        return tableau.VizManager.getVizs()[0];
    };
    TableauLib.prototype.getWorksheetCount = function () {
        var currentViz = this.getCurrentViz();
        if (!currentViz)
            return null;
        return currentViz.getWorkbook().getActiveSheet().getWorksheets().length;
    };
    TableauLib.prototype.getAllWorksheets = function () {
        var currentViz = this.getCurrentViz();
        if (!currentViz)
            return null;
        return currentViz.getWorkbook().getActiveSheet().getWorksheets();
		
    };
	TableauLib.prototype.getPublishedSheetsInfo = function () {
        var currentViz = this.getCurrentViz();
        if (!currentViz)
            return null;
        return currentViz.getWorkbook().getPublishedSheetsInfo();	
    };
    TableauLib.prototype.getWorksheet = function (idx) {
        var allWorksheets = this.getAllWorksheets();
        if (!allWorksheets)
            return null;
        return allWorksheets[idx];
    };
    TableauLib.prototype.getCurrentWorksheet = function () {
        var currentWorksheet = this.getWorksheet(0);
        if (!currentWorksheet)
            return null;
        return currentWorksheet;
    };
	TableauLib.prototype.getWorkbook = function () {
        var currentViz = this.getCurrentViz();
        if (!currentViz)
            return null;
        return currentViz.getWorkbook();
    };
	TableauLib.prototype.getViewSession = function (e) {
        var viewSession = this.findContentDashboard().getViewSession(e);
        if (!viewSession)
            return null;
        return viewSession;
    };
	
	
	
    return TableauLib;
}());
