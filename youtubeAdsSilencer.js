// ==UserScript==
// @name         Youtube Ads Silencer
// @namespace    http://linjin.me/
// @version      0.1
// @description  Lets the video ad play in a slightly less obnoxious way, so creator still gets paid.
// @author       Jin
// @match        http://youtube.com/*
// @match        https://youtube.com/*
// @match        http://www.youtube.com/*
// @match        https://www.youtube.com/*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/jinnotgin/userscripts/master/youtubeAdsSilencer.js
// ==/UserScript==

(function() {
    'use strict';

    const $ = selector => document.querySelector(selector);

    const hasClass = ($dom, className) => {
        if ($dom) {
            return [...$dom.classList].includes(className.trim());
        } else return false;
    }

    const _hideAds_bannerImages = () => {
        const $adsOverlay = $('.ytp-ad-overlay-container');
        if ($adsOverlay && !hasClass($adsOverlay, 'hidden')) {
            $adsOverlay.style.display = 'none';
            $adsOverlay.classList.add('hidden');
        }
    }

    const _hideAds_video = () => {
        const $player = $('.html5-video-player');
        const videoCont = $player === null ? null : $player.querySelector('.html5-video-container'); // TODO : set this opacity to 0 only when ad is playing
        const $video = $player === null ? null : $player.querySelector('video');

        if (hasClass($player, 'ad-interrupting')) {
            // mute the video (not the player)
            if ($video) $video.volume = 0;

            // if non skippable ad is playing after 5 seconds, force the ad to end
            if ($video && $video.currentTime > 5) {
                $video.currentTime = $video.duration - 1;
            }

            // if there is a preview, wait for the perview to end
            const $previewText = $('.ytp-ad-preview-text');
            if ($previewText && $previewText.style.display !== 'none') {
                return true;
            }

            // if this is a skippable ad, try to click it if possible (after waiting for preview)
            const $skipButton = $('.ytp-ad-skip-button-slot');
            if ($skipButton) $skipButton.click();
        }
    }

    const timeouts = {
        hideAds: null,
    }
    const hideAds = () => {
        _hideAds_bannerImages();
        _hideAds_video();
        timeouts.hideAds = setTimeout(hideAds, 333);
    }
    hideAds();

})();