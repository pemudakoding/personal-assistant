import { MessageUpsertType, isJidUser, proto } from '@adiwajshing/baileys'
import { HandlerArgs } from '../../Contracts/IEventListener'
import { MessageUpsert } from '../../Facades/Events/Message/MessageUpsert'
import Queue from '../../Facades/Queue'
import { getMessageCaption } from '../../utils'

const regex = /.add (.*)/i
export class AddMember extends MessageUpsert {
  patterns: string | false | RegExp | (string | RegExp)[] = ['.add', regex]
  fromMe: boolean = true
  groupAccess: 'all' | 'admin' | 'member' = 'admin'
  chat: 'all' | 'group' | 'user' = 'group'
  async handler({
    socket,
    props,
  }: HandlerArgs<{
    message: proto.IWebMessageInfo
    type: MessageUpsertType
  }>) {
    const jid = props.message.key.remoteJid || ''

    const text = getMessageCaption(props.message.message!)
    const participants: string[] = []
    // cek apabila ternyata add nya ad spasi dan kemungkinan add by nomor
    if (regex.test(text)) {
      text.split(/\s+/).map((w) => {
        if (!w.includes('@')) w += '@s.whatsapp.net'
        if (isJidUser(w)) participants.push(w)
      })
    }

    const quotedMessage =
      props.message.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const contacts =
      quotedMessage?.contactsArrayMessage?.contacts || [
        quotedMessage?.contactMessage,
      ] ||
      []
    if (contacts.length) {
      contacts.map((contact) => {
        const vcard = contact?.vcard || ''
        let jid = /waid=(\d+)/i.exec(vcard)![1] || ''
        jid += '@s.whatsapp.net'
        if (isJidUser(jid)) participants.push(jid)
      })
    }

    try {
      await Queue(() =>
        socket.groupParticipantsUpdate(jid, participants, 'add'),
      )
    } catch (error) {
      console.log('Bukan admin add member')
    }
  }
}