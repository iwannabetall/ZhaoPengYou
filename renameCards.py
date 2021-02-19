import os

list = os.listdir()

alter = ['A', 'K', 'Q', 'J', 'T', '9']

for card in list:
	if card[0] in alter:
		val = getCard(card[0])
	else:
		val = card[0]
	suit = getSuit(card[1])
	print(val,card[1], suit)
	newFile = val + '_of_' + suit + '.svg'
	if suit == 'joker':
		if card[0] == '1':
			newFile = 'zbig_joker.svg'
		else:
			newFile = 'vsmall_joker.svg'
	os.rename(card, newFile)


def getCard(letter):
	if letter == 'Q':
		return 'queen'
	elif letter == 'K':
		return "rking"
	elif letter == 'J':
		return 'jack'
	elif letter == 'A':
		return 'sace'
	elif letter == 'T':
		return '910'
	elif letter == '9':
		return '90'


def getSuit(letter):
	if letter == 'H':
		return 'hearts'
	if letter == 'D':
		return 'diamonds'
	if letter == 'S':
		return 'spades'
	if letter == 'C':
		return 'clubs'
	if letter == 'J':
		return 'joker'
	if letter == 'B':
		return 'back'