import React from "react";
export default (props) => {
	return (
		<div className="flex flex-col bg-white">
			<div className="flex flex-col self-stretch bg-cover bg-center h-[956px]"
				style={{
					backgroundImage: 'url(https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/yrstrglt_expires_30_days.png)',
				}}
				>
				<div className="flex-1 self-stretch pt-[45px]">
					<div className="flex flex-col items-end self-stretch mb-[146px]">
						<button className="flex flex-col items-start bg-white text-left py-[7px] px-2 mr-[15px] rounded-[40px] border-0" 
							style={{
								boxShadow: "2px 2px 10px #00000005"
							}}
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/l7h0zl96_expires_30_days.png"} 
								className="w-8 h-8 object-fill"
							/>
						</button>
					</div>
					<div className="flex flex-col items-center self-stretch mb-[201px]">
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/4uoharsf_expires_30_days.png"} 
							className="w-[103px] h-[299px] object-fill"
						/>
					</div>
					<div className="flex flex-col items-end self-stretch mb-[11px]">
						<button className="flex flex-col items-start bg-white text-left py-1.5 px-[7px] mr-[15px] rounded-[40px] border-0" 
							style={{
								boxShadow: "2px 2px 10px #00000005"
							}}
							onClick={()=>alert("Pressed!")}>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/n0zlgia4_expires_30_days.png"} 
								className="w-[34px] h-[34px] object-fill"
							/>
						</button>
					</div>
					<div className="flex flex-col items-end self-stretch mb-[11px]">
						<img
							src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/hdwfw58p_expires_30_days.png"} 
							className="w-[47px] h-[47px] mr-[13px] object-fill"
						/>
					</div>
					<div className="flex justify-center items-start self-stretch bg-white py-[22px] mx-[1px] rounded-tl-[20px] rounded-tr-[20px]" 
						style={{
							boxShadow: "4px 4px 7px #0000000D"
						}}>
						<div className="flex flex-col shrink-0 items-center mr-[34px] gap-[5px]">
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/l7urhu5b_expires_30_days.png"} 
								className="w-[25px] h-[26px] object-fill"
							/>
							<span className="text-[#7A4BC8] text-xs" >
								{"Feed"}
							</span>
						</div>
						<div className="flex flex-col shrink-0 items-center mr-[23px] gap-[7px]">
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/a7yca1ho_expires_30_days.png"} 
								className="w-7 h-[22px] object-fill"
							/>
							<span className="text-[#7A4BC8] text-xs" >
								{"Saved"}
							</span>
						</div>
						<button className="flex shrink-0 items-center bg-[#7A4BC8] text-left py-3 px-[19px] mr-5 gap-6 rounded-[40px] border-0"
							onClick={()=>alert("Pressed!")}>
							<span className="text-white text-sm" >
								{"Search"}
							</span>
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/man2aqk3_expires_30_days.png"} 
								className="w-[17px] h-[17px] object-fill"
							/>
						</button>
						<div className="flex flex-col shrink-0 items-center mr-[19px] gap-1">
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/bwlu2mhv_expires_30_days.png"} 
								className="w-7 h-[25px] object-fill"
							/>
							<span className="text-[#7A4BC8] text-xs" >
								{"Advisory"}
							</span>
						</div>
						<div className="flex flex-col shrink-0 items-center gap-[3px]">
							<img
								src={"https://storage.googleapis.com/tagjs-prod.appspot.com/v1/HgKQBstP6G/myjvdh3k_expires_30_days.png"} 
								className="w-[18px] h-6 object-fill"
							/>
							<span className="text-[#7A4BC8] text-xs" >
								{"Streak"}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}