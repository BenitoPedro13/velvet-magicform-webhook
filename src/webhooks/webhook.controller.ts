/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Post, Body } from '@nestjs/common';
import * as fs from 'fs';
import { google } from 'googleapis';

interface ICredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

@Controller('webhook')
export class WebhookController {
  @Post()
  async handleWebhook(@Body() formData: any) {
    // Processa os dados do formulário
    console.log('Received form data:', formData);

    // Atualiza o arquivo CSV no Google Drive
    await this.updateGoogleDrive(formData);

    return { success: true };
  }
  async updateGoogleDrive(formData: any) {
    // Configuração da autenticação usando as credenciais do Google API

    console.log('formData', formData);

    const credentials: ICredentials = JSON.parse(
      fs.readFileSync('credentials.json', 'utf-8'),
    );
    const { client_email, private_key } = credentials;
    const oAuth2Client = new google.auth.JWT({
      email: client_email,
      key: private_key,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    // Autorização
    const tokens = await oAuth2Client.authorize();
    oAuth2Client.setCredentials(tokens);

    // Inicialização do serviço do Google Drive
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });

    // Lógica para encontrar e atualizar o arquivo CSV no Google Drive
    const fileName = 'form_data.csv';
    const folderName = 'Your Folder Name'; // Nome da pasta no Google Drive onde o arquivo será armazenado

    // Procura pela pasta no Google Drive
    const folderQuery = `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`;
    const folderResponse = await drive.files.list({
      q: folderQuery,
      fields: 'files(id, name)',
    });

    let folderId = null;

    // Se a pasta não existir, cria uma nova pasta
    if (folderResponse.data.files.length === 0) {
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };

      const folderCreateResponse = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      } as any);

      folderId = folderCreateResponse.data.id;
    } else {
      folderId = folderResponse.data.files[0].id;
    }

    // Procura pelo arquivo no Google Drive
    const fileQuery = `'${folderId}' in parents and name='${fileName}'`;
    const fileResponse = await drive.files.list({
      q: fileQuery,
      fields: 'files(id, name)',
    });

    let fileId = null;

    // Se o arquivo não existir, cria um novo arquivo
    if (fileResponse.data.files.length === 0) {
      const fileCreateResponse = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: 'application/vnd.ms-excel',
          parents: [folderId],
        },
        media: {
          mimeType: 'application/vnd.ms-excel',
          body: 'CSV DATA HERE', // Replace with the logic to convert form data to CSV
        },
        fields: 'id',
      });

      fileId = fileCreateResponse.data.id;
    } else {
      fileId = fileResponse.data.files[0].id;

      // Atualiza o conteúdo do arquivo (opcional)
      const media = {
        mimeType: 'application/vnd.ms-excel',
        body: 'NEW CSV DATA HERE', // Replace with the logic to update form data in the CSV
      };
      await drive.files.update({
        fileId,
        media,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    console.log('File ID:', fileId);
  }
}
