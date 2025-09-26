"use client";

import { useAutoAnimate } from "@formkit/auto-animate/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { CircularButton } from "~/components/circular-button";
import {
  colors,
  getColor,
  getCommonColors,
  getTotalMistakes,
  regenerateWordPool,
  validateGuess,
} from "~/lib/game";
import { GameOptions, gameOptionsSchema } from "~/lib/game-options";
import { alphabetical, hasSameElements, range, toSwapped } from "~/lib/utils";
import { FinishedCategory } from "./play/finished-category";
import { WordTile } from "./play/word-tile";
import FadeIn from 'react-fade-in';
import Image from 'next/image';


/* eslint-disable react-hooks/exhaustive-deps */

export default function Page() {
  const params = useSearchParams();
  const [mistakesAnimateRef] = useAutoAnimate();
  const [poolAnimateRef, setPoolAnimated] = useAutoAnimate();

  const [gameOptions, setGameOptions] = useState<GameOptions | undefined>();
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [wordPool, setWordPool] = useState<string[]>([]);
  const [guesses, setGuesses] = useState<string[][]>([]);

  useEffect(() => {
    
    try {
      const decoded = JSON.parse(atob("eyJuYW1lcyI6WyIoc29tZSkgY2l0aWVzIHdlIGNvbWUgZnJvbSIsInN5bWJvbHMgb2YgdGhlIHBsYWNlIHdlJ2QgbGlrZSB0byBwbGF5IGZyaXNiZWUgc29vbiA7KSIsImEgZmV3IG9mIG91ciBmYXZvcml0ZSBzcGlyaXQgZ2FtZSBpbXBsZW1lbnRzIiwiZmlyc3QgaGFsZiBvZiBzb21lIG9mIG91ciBmYXZvcml0ZSB0b3VybmFtZW50cyB3ZSd2ZSBwbGF5ZWQgaW4iXSwid29yZHMiOltbImNoYXJsb3R0ZSIsInNlYXR0bGUiLCJuZXcgeW9yayIsInNhbiBmcmFuY2lzY28iXSxbInNoYWthIiwidWt1bGVsZSIsImh1bGEiLCJuZW5lIl0sWyJmcmVzaCBtYWRlIGZsYXBqYWNrcyIsImlrZWEgc2hlbGYiLCJvcmNhIiwic3BhIG1hc2siXSxbImdhaWEiLCJsZWkiLCJzdW4iLCJ3aWxkIl1dLCJhdXRob3IiOiIiLCJ0aXRsZSI6ImthaW1hbmEga29ubmVjdGlvbnMifQ=="));
      const options = gameOptionsSchema.parse(decoded);
      console.info("setting game options from URL", options);

      for (let i = 0; i < 4; i++) {
        options.words[i].sort(alphabetical);
      }

      console.info("setting game options from URL", options);

      setGameOptions(options);
      setWordPool(regenerateWordPool(options, guesses));
    } catch {
      console.error("could not parse game options from URL");
    }
  }, []);

  // ensure that gameOptions won't be undefined
  if (gameOptions === undefined) {
    return <main></main>;
  }

  // derived state
  const totalMistakes = getTotalMistakes(gameOptions, guesses);
  const remainingMistakes = 4 - totalMistakes;
  const wonGame = wordPool.length === 0;
  const lostGame = remainingMistakes === 0;
  const submitDisabled =
    selectedWords.length !== 4 ||
    guesses.some((guess) => hasSameElements(guess, selectedWords));

  return (
    <main className="flex flex-col gap-4">
      <div>
        <Toaster
          containerStyle={{
            position: "relative",
            inset: 0,
            flexShrink: 0,
          }}
          toastOptions={{
            duration: 3000,
            className:
              "!shrink-0 !rounded-md !bg-stone-900 !p-2 !text-stone-50 !shadow-md",
          }}
        />

        <h2>
          <span className="text-2xl font-semibold">
            {gameOptions.title.toUpperCase()}
          </span>{" "}
        </h2>
      </div>

      <div className="flex flex-col gap-2 sm:gap-4">
        {/* print out finished categories */}
        {guesses.map((guess) =>
          validateGuess(gameOptions, guess) ? (
            <FinishedCategory
              name={gameOptions.names[getColor(gameOptions, guess[0])]}
              words={gameOptions.words[getColor(gameOptions, guess[0])]}
              color={colors[getColor(gameOptions, guess[0])]}
              key={getColor(gameOptions, guess[0])}
            />
          ) : undefined,
        )}

        {/* grid from the word pool */}
        {wordPool.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-4" ref={poolAnimateRef}>
            {wordPool.map((word) => (
              <WordTile
                key={word}
                selected={selectedWords.includes(word)}
                onClick={() => {
                  if (selectedWords.includes(word)) {
                    setSelectedWords(selectedWords.filter((w) => w !== word));
                  } else if (selectedWords.length < 4) {
                    setSelectedWords([...selectedWords, word]);
                  }
                }}
              >
                {word}
              </WordTile>
            ))}
          </div>
        )}
      </div>

      {!wonGame && !lostGame ? (
        <div className="flex flex-wrap gap-4 place-self-center sm:place-self-auto">
          <CircularButton
            onClick={() =>
              setWordPool(regenerateWordPool(gameOptions, guesses))
            }
          >
            Shuffle
          </CircularButton>

          <CircularButton
            disabled={selectedWords.length === 0}
            onClick={() => setSelectedWords([])}
          >
            Deselect all
          </CircularButton>

          <CircularButton
            variant={submitDisabled ? undefined : "filled"}
            disabled={submitDisabled}
            onClick={async () => {
              const result = validateGuess(gameOptions, selectedWords);

              if (result === true) {
                // sort so the words swap to the right order
                const sortedSelected = selectedWords.toSorted(alphabetical);

                // swap guesses into the beginning of the pool
                for (let a = 0; a < 4; a++) {
                  setWordPool((pool) => {
                    const b = pool.indexOf(sortedSelected[a]);
                    return toSwapped(pool, a, b);
                  });
                }

                setPoolAnimated(true);

                await new Promise((res) => setTimeout(res, 500));
                setGuesses([...guesses, selectedWords]);
                setSelectedWords([]);
                setWordPool((pool) =>
                  pool.filter((word) => !selectedWords.includes(word)),
                );

                setPoolAnimated(false);
              } else {
                if (getCommonColors(gameOptions, selectedWords) === 3) {
                  toast("One away...");
                }

                setGuesses([...guesses, selectedWords]);
                setSelectedWords([]);
              }
            }}
          >
            Submit
          </CircularButton>
        </div>
      ) : wonGame ? (
          <FadeIn visible>
            
<div>
  <p>Thanks for solving our little puzzle, and we hope you enjoyed it!</p>
  <br></br>

  <p>We are <strong>Konnections</strong>, a team created to celebrate the connections we all make by tossing the plastic circle. Sometimes fleeting, sometimes lasting the rest of our lives—always deeply felt—we cherish those moments of kinship that occur on the playing field, on the sideline, at the tournament party, and scrolling back through the team Groupme years down the line.</p>
  <br></br>
  <Image src={require('/assets/Fuji.png')} alt="Crane and Fan hold a disc in front of a team of ultimate players near Mount Fuji" />
  <br></br>  
  <p><strong>Konnections</strong> is a synthesis of a number of different teams that have crossed paths and intermingled over the years, konnected by a common love of ultimate.</p>
 <br></br>  
  <h3><strong>Bid Notes:</strong></h3>
 <br></br>  
  <ul>
    <li>
      <strong>🎉 Spirit:</strong> The spirit of ultimate is core to our identity as a team and as players. We never attend a tournament without a zany spirit game to play with our opponents and we usually bring spirit gifts too. Our spirit game will encourage our fellow players to think about the konnections that unite us and hopefully help them learn more about their friends and opponents! We take Spirit seriously. We won the spirit of the game award in the Mixed Division at Beach Natties 2022 (with our mutual friend Cat Nansalo)!
    </li>
    <br></br>  
    <Image src={require('/assets/Spirited.png')} alt="Happy Ultimate players huddle after a spirited game on a hazy beach." />
<br></br>  
    <li>
      <strong>💯 Competitiveness:</strong> We just won Sunbreak 2025! Our team is largely composed of competitive club players either grinding it out in the upper half of regionals or competing for elite club teams. While this specific iteration will have new faces and new friendships, we’re all competitive ultimate players in our own communities.
    </li>
    <br></br>  
    <Image src={require('/assets/Sunbreak.png')} alt="A team photo of Treat Yo Shelf at Sunbreak 2024" />
<br></br>  
    <li>
      <strong>👷‍♀️ Volunteerism:</strong> Our team is comprised almost entirely of Ultimate Community board members, organizers and coaches. We have all spent significant time helping with tournaments in our own communities and we are, of course, happy to assist in any way we can whether that’s event check-in, clean up, coolers, or anything else you might need us to help with. Here we are cooking up a mess of burritos for <a href="https://ashevilleultimate.org/e/hodown-throwdown-recreational">Hodown Throwdown 2024</a>:
    </li>
    <br></br>  
    <Image src={require('/assets/Volunteering.png')} alt="A busy kitchen where an ultimate player is chopping up peppers" />
<br></br>  
    <li>
      <strong>👭 Making New Friends!</strong> We’re so happy to hear that! Making new friends is literally what this team is about!
    </li>
    <br></br>  
    <Image src={require('/assets/MakingFriends.png')} alt="Ultimate players play a spirit game involving Spa Masks. Jake looks kind of dangerous." />
    <br></br>  
  </ul>

  <p>Thanks so much for your consideration and for everything you’re doing to organize an awesome event. We hope this is the best Kaimana tournament yet!</p>

  <br></br>
  <br></br>
  <p>This page was created using an open source project from Zach Robinson: https://github.com/zsrobinson/custom-connections</p>
  
</div>
          </FadeIn>
      ) : lostGame ? (
        <p>You lost, refresh to try again!</p>
      ) : null}
    </main>
  );
}
