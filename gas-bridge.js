/* GAS 백엔드 연결 브리지: google.script.run 호출을 fetch(POST)로 변환 (Safari 포함 모든 브라우저 동작) */
(function () {
    const API_URL = 'https://script.google.com/macros/s/AKfycbx3SxdxK70zS4VDrMbwPWivtb5l89yX3EsIDCX_OB0-9P4zAtzWy1-Yx7AqRApUE97QLA/exec';

    function call(fn, args, onOk, onFail) {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ fn: fn, args: args })
        })
            .then(r => r.json())
            .then(res => {
                if (res && res.ok) { if (onOk) onOk(res.result); }
                else { throw new Error((res && res.error) || '서버 오류'); }
            })
            .catch(err => { if (onFail) onFail(err); else console.error('[GAS]', fn, err); });
    }

    function makeRunner(onOk, onFail) {
        return new Proxy({}, {
            get: function (_, name) {
                if (name === 'withSuccessHandler') return function (f) { return makeRunner(f, onFail); };
                if (name === 'withFailureHandler') return function (f) { return makeRunner(onOk, f); };
                if (name === 'withUserObject') return function () { return makeRunner(onOk, onFail); };
                return function () { call(name, Array.prototype.slice.call(arguments), onOk, onFail); };
            }
        });
    }

    window.google = window.google || {};
    window.google.script = { run: makeRunner(null, null) };
})();
