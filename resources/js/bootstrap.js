import axios from 'axios';
import $ from 'jquery';
import select2 from 'select2';
import 'jquery-mask-plugin';
import 'select2/dist/css/select2.min.css';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

window.$ = window.jQuery = $;

// Select2 CJS export is a factory — attach it to this jQuery instance.
if (typeof $.fn.select2 !== 'function') {
    if (typeof select2 === 'function') {
        select2(window, $);
    }
}
