import { MessageUpsertType, proto } from '@whiskeysockets/baileys'
import { ChatType } from '../../Contracts/ChatType'
import { HandlerArgs } from '../../Contracts/IEventListener'
import { MessageUpsert } from '../../Facades/Events/Message/MessageUpsert'
import Queue from '../../Facades/Queue'
import { sendMessageWTyping } from '../../utils'

export class TagAdmin extends MessageUpsert {
  chat: ChatType = 'group'
  fromMe: boolean = true
  onlyMe: boolean = true
  patterns: string | false | RegExp | (string | RegExp)[] = [
    '.tagadmin',
    '/tagadmin',
    '/admin',
    '.admin',
  ]
  async handler({
    socket,
    props,
  }: HandlerArgs<{
    message: proto.IWebMessageInfo
    type: MessageUpsertType
  }>): Promise<void> {
    const metadata = await socket.groupMetadata(
      props.message.key.remoteJid || '',
    )
    Queue(() =>
      sendMessageWTyping(
        {
          text: 'PING!!',
          mentions: metadata.participants
            .filter((participant) => !!participant.admin)
            .map((participant) => participant.id),
        },
        props.message.key.remoteJid || '',
        socket,
        {},
      ),
    )
  }
}
