import React, { useEffect, useState } from 'react';
import { UploadingItemDTO } from '~/types/gallery';
import ProgressBar from './ProgressBar/ProgressBar';

const FilesList = (props: { files: File[]; uploading: UploadingItemDTO[] }) => {
  const [infos, setInfos] = useState<File[]>([]);
  const [uploadInfo, setUploadInfo] = useState<UploadingItemDTO[]>([]);

  useEffect(() => {
    // console.log(files);

    props.files && setInfos(Object.values(props.files));
  }, [props.files]);

  useEffect(() => {
    // console.log(files);
    props.uploading && setUploadInfo(Object.values(props.uploading));
  }, [props.uploading]);

  function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  // useEffect(() => {
  //   console.log(infos);
  // }, [infos]);

  return (
    <>
      {infos.length ? (
        <table className="files-table">
          <tbody>
            {infos.map((info) => {
              const uploadingIndex = uploadInfo.findIndex((el) => el.name === info.name);

              return (
                <tr key={info.name}>
                  <td>{info.name}</td>
                  <td>{formatBytes(info.size)}</td>
                  {/* <td>{uploadingIndex !== -1 ? uploadInfo[uploadingIndex].progress : 0}</td> */}
                  <td>
                    <ProgressBar
                      progress={uploadingIndex !== -1 ? uploadInfo[uploadingIndex].progress : 0}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : null}
    </>
  );
};

export default FilesList;
