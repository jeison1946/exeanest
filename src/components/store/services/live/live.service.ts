import { Injectable } from '@nestjs/common';
import fetch from 'node-fetch';
import * as https from 'https';
import axios from 'axios';

@Injectable()
export class LiveService {
  async getLive() {
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });
    const response = await fetch(
      `${process.env.CMS}/api/v1/client/rules?id=100`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'Application/json',
        },
        agent,
      },
    )
      .then(async (response) => {
        if (response.status == 200) {
          return await response.json();
        } else {
          return false;
        }
      })
      .catch(() => {
        return false;
      });

    if (response) {
      return JSON.parse(response.payload);
    }

    return {};
  }

  async live() {
    const data = await this.getLive();
    if (data) {
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });
      return await axios.get(data['100'].song.url, {
        headers: {
          Range: 'bytes=60000-',
        },
        responseType: 'stream',
        httpsAgent: agent,
      });
    }
    throw Error('Tuvimos problemas al procesar la solicitud');
  }
}
