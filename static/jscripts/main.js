"use strict";

var Overlook = Overlook || {};

UF.App.include('jscripts/overlook/DataController.js');
UF.App.include('jscripts/repo/uf/utils/LanguageController.js');
UF.App.include('jscripts/shared/communication/BridgeClient.js');
UF.App.include('jscripts/shared/language/LanguageScreen.js');
UF.App.include('jscripts/shared/language/UniversalLanguageButton.js');

UF.App.include('jscripts/repo/uf/display/Image.js');

UF.App.include('jscripts/overlook/Intro.js');
UF.App.include('jscripts/overlook/virtue/VirtueSelection.js');
UF.App.include('jscripts/overlook/input/DeedSubmission.js');
UF.App.include('jscripts/overlook/input/CountrySubmission.js');
UF.App.include('jscripts/overlook/photo/PhotoScreen.js');
UF.App.include('jscripts/overlook/result/ResultScreen.js');
UF.App.include('jscripts/overlook/globe/Globe.js');

UF.Main.startApp = async function() {
	MOTJ.BridgeClient = new MOTJ.BridgeClient("kiosk-01", "overlook");

	await Overlook.DataController.init();

	const languageScreen = new MOTJ.LanguageScreen();
	const languageButton = new MOTJ.UniversalLanguageButton();

	languageButton.transformy = 50;

	const globe = new Overlook.Globe();
	UF.Stage.appendChild(globe);

	const intro = new Overlook.Intro();
	const selection = new Overlook.VirtueSelection(Overlook.DataController.getVirtues());
	const deedSubmission = new Overlook.DeedSubmission(Overlook.DataController.getVirtues());
	const countrySubmission = new Overlook.CountrySubmission();
	const photo = new Overlook.PhotoScreen();
	const result = new Overlook.ResultScreen();

	languageScreen.addEventListener(MOTJ.LANGUAGE_SCREEN_HIDDEN, () => {
		globe.brighten();

		intro.show();
		UF.Stage.appendChild(intro);
	});

	intro.addEventListener(Overlook.INTRO_HIDDEN, () => {
		globe.dim();

		selection.show();
		UF.Stage.appendChild(selection);
	});

	selection.addEventListener(Overlook.SELECTION_HIDDEN, (virtue) => {
		globe.zoomTo(1.65, 1.0);

		deedSubmission.show(virtue);
		UF.Stage.appendChild(deedSubmission);
	});

	deedSubmission.addEventListener(Overlook.SUBMISSION_BACK, () => {
		selection.show();
		UF.Stage.appendChild(selection);
	});

	let responseObj;
	deedSubmission.addEventListener(Overlook.SUBMISSION_NEXT, (id, response) => {
		responseObj = {
			tolerantTopic: id,
			submission: response,
			language_str: UF.LanguageController.currentLanguage,
			language: Overlook.DataController.getLanguageId(UF.LanguageController.currentLanguage),
			file: null
		};

		countrySubmission.show();
		UF.Stage.appendChild(countrySubmission);
	});

	countrySubmission.addEventListener(Overlook.COUNTRY_SELECTED, (loc) => {
		globe.rotateToLatLong(loc.lat, loc.long);
	});

	countrySubmission.addEventListener(Overlook.COUNTRY_SUBMISSION_NEXT, (locId) => {
		responseObj.country = locId;

		photo.show();
		UF.Stage.appendChild(photo);
	});

	photo.addEventListener(Overlook.PHOTO_BG_SHOWING, () => {
		globe.pause();
	});

	photo.addEventListener(Overlook.PHOTO_SCREEN_CLOSING, () => {
		globe.resume();
	});

	photo.addEventListener(Overlook.PHOTO_COMPLETE, (photo) => {
		console.log(responseObj);
		result.showLoader();
		UF.Stage.appendChild(result);

		(async function() {
			const data = await Overlook.DataController.submit(photo, responseObj);

			console.log(data);
			result.show(data.image, responseObj.submission, photo, Overlook.DataController.getCountry(responseObj.country), responseObj.language_str);
		} ());
	});

	globe.dim();
	languageScreen.show(1);
	UF.Stage.appendChild(languageScreen);
}