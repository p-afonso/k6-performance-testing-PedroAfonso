import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getPostsDuration = new Trend('get_posts', true);
export const RateContentOK = new Rate('content_OK');

export const options = {
  // Rampa com 3 stages: inicia com 7 VUs, pico de 92 VUs, total de 3.5 min
  vus: 7,
  stages: [
    { duration: '1m', target: 46 },
    { duration: '1m30s', target: 92 },
    { duration: '1m', target: 92 }
  ],
  // 3 thresholds
  thresholds: {
    // 90% das respostas abaixo de 6800ms
    get_posts: ['p(90)<6800'],
    // menos de 25% das requisicoes retornando erro
    http_req_failed: ['rate<0.25'],
    // pelo menos 75% das respostas com status 200
    content_OK: ['rate>0.75']
  }
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://jsonplaceholder.typicode.com';

  const params = {
    headers: {
      Accept: 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}/posts`, params);

  getPostsDuration.add(res.timings.duration);

  RateContentOK.add(res.status === OK);

  check(res, {
    'GET Posts - Status 200': () => res.status === OK
  });
}
