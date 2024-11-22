import AgoraRTC, { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import AgoraRTM, { RtmChannel, RtmClient } from "agora-rtm-sdk";

const body = document.getElementById('body') as HTMLElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
const themeIcon = document.getElementById('theme-icon') as HTMLElement;
const idInput = document.getElementById('idInput') as HTMLInputElement;
const searchButton = document.getElementById('searchButton') as HTMLButtonElement;
const radioButtons = document.querySelectorAll('input[name="id_type"]') as NodeListOf<HTMLInputElement>;
const botTypeButtons = document.querySelectorAll('input[name="bot_type"]') as NodeListOf<HTMLInputElement>;
const result = document.getElementById('result') as HTMLElement;
let rtcClient: IAgoraRTCClient;
let rtmClient: RtmClient;
let rtmChannel: RtmChannel;

let selectedBotType: string = '';

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    themeIcon.classList.toggle('fa-sun', body.classList.contains('dark-mode'));
    themeIcon.classList.toggle('fa-moon', !body.classList.contains('dark-mode'));
});

radioButtons.forEach(radio => radio.addEventListener('change', () => {
    idInput.disabled = false;
    searchButton.disabled = true;
    idInput.value = '';
}));

botTypeButtons.forEach(button => button.addEventListener('change', () => {
    const checkedButton = document.querySelector('input[name="bot_type"]:checked') as HTMLInputElement;
    selectedBotType = checkedButton ? checkedButton.value : '';
    updateParticipantCountOption();
    updateSearchButtonState();
}));

idInput.addEventListener('input', updateSearchButtonState);

function updateSearchButtonState(): void {
    const idValueValid = /^\d+$/.test(idInput.value);
    searchButton.disabled = !(idValueValid && selectedBotType);
}

function updateParticipantCountOption(): void {
    const participantCountSelect = document.getElementById('participantCount') as HTMLSelectElement;
    if (participantCountSelect) {
        participantCountSelect.innerHTML = selectedBotType === 'ガチギレ'
            ? Array.from({ length: 18 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')
            : `<option value="1">1</option>`;
    }
}

async function displayLoadingMessage(): Promise<void> {
    result.innerHTML = `
        <div class="loading-message">
            <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            検索中...
        </div>
    `;
}

searchButton.addEventListener('click', async () => {
    await handleSearch();
});

async function handleSearch(): Promise<void> {
    displayLoadingMessage();
    const selectedType = document.querySelector('input[name="id_type"]:checked') as HTMLInputElement;
    const id = idInput.value;

    if (!selectedType) return;

    try {
        let response: Response, data: any;
        if (selectedType.value === "user_id") {
            response = await fetch(`/yay-api/v1/posts/active_call?user_id=${id}`);
            data = await response.json();
            data.conference_call ? displayConferenceDetails(data.conference_call) : showNoCallMessage();
        } else if (selectedType.value === "conference_id") {
            response = await fetch(`/yay-api/v2/calls/conferences/${id}`);
            data = await response.json();
            console.log(data)
            displayConferenceDetails(data.data.conference_call);
        } else if (selectedType.value === "post_id") {
            response = await fetch(`/yay-api/v2/posts/${id}`);
            data = await response.json();
            const post = data.data.post;
            if (post.conference_call) {
                const conferenceResponse = await fetch(`/yay-api/v2/calls/conferences/${post.conference_call.id}`);
                const conferenceData = await conferenceResponse.json();
                displayConferenceDetails(conferenceData.data.conference_call);
            } else {
                showNoCallMessage();
            }
        }
    } catch (error) {
        console.error(error);
        result.innerHTML = `<div class="alert alert-danger mt-3">エラーが発生しました。IDが正しいか確認してください。</div>`;
    }
}

function showNoCallMessage(): void {
    result.innerHTML = `<div class="alert alert-info mt-3">アクティブな通話が見つかりませんでした。</div>`;
}

function generateUserUUID(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


async function handleJoinClick(conference_call_id: string): Promise<void> {
    try {
        const participantCountElement = document.getElementById('participantCount') as HTMLSelectElement;
        if (!participantCountElement) {
            throw new Error('Participant count element not found.');
        }

        const selectedCount = parseInt(participantCountElement.value, 10);
        if (isNaN(selectedCount) || selectedCount <= 0) {
            throw new Error('Invalid participant count selected.');
        }

        const userUUIDs = Array.from({ length: selectedCount }, () => generateUserUUID());

        for (const userUUID of userUUIDs) {
            await joinCall(conference_call_id);
        }

        alert(`${selectedCount} 人が通話に参加しました。`);

        displayJoinedView(conference_call_id);
    } catch (err) {
        console.error('Error joining conference call:', err);
        alert('通話への参加に失敗しました。');
    }
}

function redirectToUserSpecificRoute(conference_call_id: string, userUUID: string): void {
    const newRoute = `/conference/${conference_call_id}/user/${userUUID}`;
    window.location.href = newRoute; 
}

function displayConferenceDetails(conference) {function restoreOriginalView(): void {
    const mainContent = document.getElementById("main-content") as HTMLElement;
    mainContent.innerHTML = `
        <%- include("partials/original-view") %>
    `;
}

function displayJoinedView(conference_call_id: string): void {
    const mainContent = document.getElementById("main-content") as HTMLElement;
    mainContent.innerHTML = `
        <%- include("partials/joined-view", { conference_call_id: conference_call_id }) %>
    `;

    document.getElementById("backButton")?.addEventListener("click", () => {
        restoreOriginalView();
    });

    document.getElementById("kickButton")?.addEventListener("click", async () => {
        const members = await fetchChannelMembers();
        handleKickOrBan("kick", members);
    });

    document.getElementById("banButton")?.addEventListener("click", async () => {
        const members = await fetchChannelMembers();
        handleKickOrBan("kick", members); // 永久追放も同じメッセージ内容
    });

    document.getElementById("requestUnmuteButton")?.addEventListener("click", async () => {
        handleRequestUnmute();
    });

    document.getElementById("unmuteButton")?.addEventListener("click", async () => {
        const members = await fetchChannelMembers();
        handleUnmute(members);
    });
}

    const availableSlots = conference.max_participants - conference.conference_call_users_count;
    result.innerHTML = `
        <div class="conference-card card mt-3">
            <div class="conference-header p-3">
                <h5 class="card-title mb-0">通話詳細</h5>
            </div>
            <div class="card-body">
                <p><strong>通話ID:</strong> ${conference.id}</p>
                <p><strong>参加人数:</strong> ${conference.conference_call_users_count} / ${conference.max_participants}</p>
                <h6 class="mb-3">参加者一覧</h6>
                <div class="user-list">
                    ${conference.conference_call_users.map(user => {
                        const role = conference.conference_call_user_roles.find(role => role.user_id === user.id)?.role;
                        let roleBadge = '';
                        if (role === 'host') roleBadge = `<span class="badge bg-pink ms-2">枠主</span>`;
                        else if (role === 'moderator') roleBadge = `<span class="badge bg-blue ms-2">サブ枠主</span>`;

                        const onlineBadge = user.online_status === "online"
                            ? `<span class="badge bg-green ms-auto">オンライン</span>`
                            : `<span class="badge bg-gray ms-auto">オフライン</span>`;

                        return `
                            <div class="participant-item d-flex align-items-center">
                                <img src="${user.profile_icon_thumbnail}" class="participant-avatar" alt="${user.nickname}">
                                <span class="text-muted">${user.nickname}</span>
                                ${roleBadge}
                                ${onlineBadge}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="mb-3">
                <label for="participantCount" class="form-label">参加人数を選択してください</label>
                <select id="participantCount" class="form-select">
                    ${Array.from({ length: availableSlots }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                </select>
            </div>
            <button id="joinButton" class="btn btn-success">参加する</button>
        </div>
    `;

    document.getElementById('joinButton').addEventListener('click', async () => {
        await handleJoinClick(conference.id);
    });
}

async function joinCall(conference_call_id) {
    try {
        let bot_id = null;
        let botIsActive = true;

        do {
            const randomBotIdResponse = await fetch("/api/bot-api/random_bot_id");
            if (!randomBotIdResponse.ok) throw new Error('Failed to fetch random bot ID');

            const randomBotIdData = await randomBotIdResponse.json();
            bot_id = randomBotIdData.bot.id;

            const botStatusResponse = await fetch(`/api/bot-api/${bot_id}/status`);
            if (!botStatusResponse.ok) throw new Error('Failed to fetch bot status');

            const botStatusData = await botStatusResponse.json();
            botIsActive = botStatusData.isActive;

            if (botIsActive) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } while (botIsActive);

        const agoraInfoResponse = await fetch(`/api/agora-api/agora_info?bot_id=${bot_id}&conference_call_id=${conference_call_id}`);
        if (!agoraInfoResponse.ok) throw new Error('Failed to fetch Agora data');

        const agoraInfo = await agoraInfoResponse.json();
        const { APP_ID, agoraRtmToken, agora_channel_token, agora_channel, conference_call_user_uuid } = agoraInfo;

        if (!APP_ID || !agoraRtmToken || !agora_channel_token || !agora_channel || !conference_call_user_uuid) {
            throw new Error('Incomplete Agora info');
        }

        rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        rtmClient = AgoraRTM.createInstance(APP_ID);

        // RTMログインとチャンネル参加
        await rtmClient.login({ token: agoraRtmToken, uid: conference_call_user_uuid });
        rtmChannel = rtmClient.createChannel(agora_channel);
        await rtmChannel.join();

        // RTCログインとチャンネル参加
        await rtcClient.join(APP_ID, agora_channel, agora_channel_token, conference_call_user_uuid);
        rtcClient.enableAudioVolumeIndicator();

        // マイクのオーディオトラック作成
        const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        await rtcClient.publish([localAudioTrack]);

        rtcClient.on("user-published", async (user, mediaType) => {
            await rtcClient.subscribe(user, mediaType);
            if (mediaType === "audio") {
                const remoteAudioTrack = user.audioTrack;
                remoteAudioTrack.play();
            }
        });

        rtcClient.on("user-unpublished", (user) => {
            const remoteAudioTrack = user.audioTrack;
            if (remoteAudioTrack) {
                remoteAudioTrack.stop();
            }
        });

        // データベースに参加ユーザー情報を保存
        await fetch(`/api/users/owner/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: conference_call_user_uuid, conference_call_id }),
        });

        // RTMチャンネルの初期化
        initializeRtmChannel(bot_id);
    } catch (err) {
        console.error('Error during joinCall:', err);
    }
}


async function initializeRtmChannel(bot_id: string) {
    rtmChannel.on('ChannelMessage', async (message, memberId) => {
        try {
            console.log(message)
            const startIndex = message.text.indexOf('{');
            const endIndex = message.text.lastIndexOf('}');
            if (startIndex !== -1 && endIndex !== -1) {
                const jsonContent = message.text.substring(startIndex, endIndex + 1);
                const messageContent = JSON.parse(jsonContent);
                console.log(messageContent)
                /*
                    kick 40eca28d-10b9-4d24-9b82-8aaf98e34397 1732189101 fc65a8ea752e9ee5ba623737f650e54a
                    kick e2036ca2-ab78-451b-8eae-d8d7456ae24b 1732189227 2b4fafbcb9edc8c1ec399464b51f1608
                    muteAudio e2036ca2-ab78-451b-8eae-d8d7456ae24b 1732189249 ba37f374abf83c4e4654b354ddc27f57
                    muteAudio e2036ca2-ab78-451b-8eae-d8d7456ae24b 1732189329 dc16c0da8f60706c010ab42f4ae5e877
                    requestLiftAudioMute
                    liftAudioMute 7182298f-c14b-43e8-80de-863087ffbded 1732189415 516339b30f9ed3f4da4ce337825b1d39
                    updateConference
                */
                // await this.handleMessageContent(messageContent, memberId, bot_id);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    rtmChannel.on('MemberLeft', async (memberId) => {
        if (this.owner && this.owner === memberId) {
            await this.leaveChannel();
        }
    });
}

function generateTimestamp(): number {
    return Math.floor(Date.now() / 1000);
}

function generateFixedString(): string {
    return Math.random().toString(36).substring(2, 34);
}

async function fetchChannelMembers(): Promise<string[]> {
    if (!rtmChannel) {
        console.error("RTMチャンネルが初期化されていません。");
        return [];
    }

    try {
        const members = await rtmChannel.getMembers();
        console.log(members)
        return members; // AgoraのメンバーUIDリスト
    } catch (error) {
        console.error("メンバーの取得に失敗しました:", error);
        return [];
    }
}

function restoreOriginalView(): void {
    const mainContent = document.getElementById("main-content") as HTMLElement;
    mainContent.innerHTML = `
        <%- include("partials/original-view") %>
    `;
}

function displayJoinedView(conference_call_id: string): void {
    const mainContent = document.getElementById("main-content") as HTMLElement;
    mainContent.innerHTML = `
        <%- include("partials/joined-view", { conference_call_id: conference_call_id }) %>
    `;

    document.getElementById("backButton")?.addEventListener("click", () => {
        restoreOriginalView();
    });

    document.getElementById("kickButton")?.addEventListener("click", async () => {
        const members = await fetchChannelMembers();
        handleKickOrBan("kick", members);
    });

    document.getElementById("banButton")?.addEventListener("click", async () => {
        const members = await fetchChannelMembers();
        handleKickOrBan("kick", members); // 永久追放も同じメッセージ内容
    });

    document.getElementById("requestUnmuteButton")?.addEventListener("click", async () => {
        handleRequestUnmute();
    });

    document.getElementById("unmuteButton")?.addEventListener("click", async () => {
        const members = await fetchChannelMembers();
        handleUnmute(members);
    });
}


async function handleKickOrBan(action: string, members: string[]): Promise<void> {
    try {
        if (!rtmChannel) {
            console.error("RTMチャンネルが初期化されていません。");
            return;
        }

        for (const memberUUID of members) {
            const timestamp = generateTimestamp();
            const fixedString = generateFixedString();
            const message = `${action} ${memberUUID} ${timestamp} ${fixedString}`;
            await rtmChannel.sendMessage({ text: message });
            console.log(`メッセージ送信: ${message}`);
        }

        alert(`${action === "kick" ? "追放" : "永久追放"}メッセージを全メンバーに送信しました。`);
    } catch (error) {
        console.error("追放または永久追放処理に失敗しました:", error);
    }
}

async function handleRequestUnmute(): Promise<void> {
    try {
        if (!rtmChannel) {
            console.error("RTMチャンネルが初期化されていません。");
            return;
        }

        await rtmChannel.sendMessage({ text: "requestLiftAudioMute" });
        alert("解除申請を送信しました。");
    } catch (error) {
        console.error("解除申請の送信に失敗しました:", error);
    }
}

async function handleUnmute(members: string[]): Promise<void> {
    try {
        if (!rtmChannel) {
            console.error("RTMチャンネルが初期化されていません。");
            return;
        }

        for (const memberUUID of members) {
            const timestamp = generateTimestamp();
            const fixedString = generateFixedString();
            const message = `liftAudioMute ${memberUUID} ${timestamp} ${fixedString}`;
            await rtmChannel.sendMessage({ text: message });
            console.log(`ミュート解除メッセージ送信: ${message}`);
        }

        alert("ミュート解除メッセージを全メンバーに送信しました。");
    } catch (error) {
        console.error("ミュート解除処理に失敗しました:", error);
    }
}